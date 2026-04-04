# Job pipeline — must match Kanban columns
VALID_JOB_STATUSES = frozenset(
    {"wishlist", "applied", "screening", "interview", "offer", "rejected"}
)
