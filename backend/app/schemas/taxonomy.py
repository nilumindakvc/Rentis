from pydantic import BaseModel


class SubtypeOut(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class SubtypeCreate(BaseModel):
    category_id: int
    name: str
    slug: str


class CategoryOut(BaseModel):
    id: int
    primary_category_id: int
    name: str
    slug: str
    home_page_visibility: bool
    subtypes: list[SubtypeOut] = []

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    primary_category_id: int
    name: str
    slug: str
    home_page_visibility: bool = True


class CategoryUpdate(BaseModel):
    name: str
    slug: str
    home_page_visibility: bool = True


class PrimaryCategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    secondary_categories: list[CategoryOut] = []

    model_config = {"from_attributes": True}


class PrimaryCategoryCreate(BaseModel):
    name: str
    slug: str
