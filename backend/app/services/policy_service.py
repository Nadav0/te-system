from sqlalchemy.orm import Session
from app.models.policy import PolicyRule
from app.models.expense import ExpenseItem


def check_item_violations(db: Session, item: ExpenseItem) -> tuple[bool, str | None]:
    """Check an expense item against active policy rules. Returns (violated, detail)."""
    rules = db.query(PolicyRule).filter(
        PolicyRule.active == True,
        PolicyRule.category.in_([item.category, "any"]),
    ).all()

    violations = []
    for rule in rules:
        if rule.max_amount_per_item is not None and float(item.amount) > float(rule.max_amount_per_item):
            violations.append(
                f"{rule.category.title()} limit is ${rule.max_amount_per_item:.2f}/item (submitted: ${item.amount:.2f})"
            )
        if rule.requires_receipt_above is not None and float(item.amount) > float(rule.requires_receipt_above):
            if not item.receipt_url:
                violations.append(
                    f"Receipt required for {rule.category} expenses above ${rule.requires_receipt_above:.2f}"
                )

    if violations:
        return True, "; ".join(violations)
    return False, None


def recheck_report_items(db: Session, report_id: str) -> None:
    """Recheck all items in a report after policy changes."""
    from app.models.expense import ExpenseItem
    items = db.query(ExpenseItem).filter(ExpenseItem.report_id == report_id).all()
    for item in items:
        violated, detail = check_item_violations(db, item)
        item.policy_violation = violated
        item.violation_detail = detail
    db.commit()
