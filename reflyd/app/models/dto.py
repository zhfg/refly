from pydantic import BaseModel


class VisitLink(BaseModel):
    last_visit_time: float
    title: str
    url: str
    visit_count: int
