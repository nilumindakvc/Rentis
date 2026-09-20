from pydantic import BaseModel


class SubtypeOut(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    subtypes: list[SubtypeOut] = []

    model_config = {"from_attributes": True}
