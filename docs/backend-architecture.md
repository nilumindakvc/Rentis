# Backend Architecture — FastAPI for Spring Boot Developers

A quick reference for navigating `backend/`, written for someone who knows Spring Boot/JPA but is new to FastAPI/SQLAlchemy.

## Stack equivalents

| Concern | Spring Boot | Rentis backend |
|---|---|---|
| Web framework | Spring Web (MVC) | FastAPI |
| ORM | Hibernate / JPA | SQLAlchemy (2.0 style) |
| Migrations | Flyway / Liquibase | Alembic (`alembic/versions/`) |
| Request/response contracts | DTOs + Bean Validation | Pydantic models, called "schemas" |
| Dependency injection | IoC container, `@Autowired` | `Depends()` — plain functions resolved per-request, no container |
| Config | `application.properties` | `pydantic-settings` reading `backend/.env` (`app/config.py`) |
| App server | Embedded Tomcat | Uvicorn (ASGI) |
| API docs | springdoc/OpenAPI annotations | Free, generated from type hints — see `/docs` |

## Layers, per resource

Spring's Controller → Service → Repository becomes four folders, same idea, less machinery:

1. **`app/models/`** — SQLAlchemy classes = `@Entity` classes. Columns and `relationship()` calls, same shape as JPA field mappings. Example: `app/models/property.py`.
2. **`app/schemas/`** — Pydantic classes = request/response DTOs. **Deliberately separate from the DB model** — a `PropertyCreate` (input shape) is not the same class as `PropertyOut` (output shape), even though both describe a property. Never serialize a model directly; always go through a schema. Example: `app/schemas/property.py`.
3. **`app/crud/`** — plain functions doing the DB work = `@Repository`/`@Service` combined. No interfaces, no auto-implementation like Spring Data JPA — queries are written by hand against a `Session`. Example: `app/crud/properties.py`.
4. **`app/routers/`** — `@RestController` equivalent. An `APIRouter()` per resource; each `@router.get/post/put/patch/delete(...)`-decorated function is one endpoint. Example: `app/routers/properties.py`.

`app/main.py` wires resources together the way `@SpringBootApplication` + component scanning would, except explicitly — one `app.include_router(...)` call per resource, no auto-discovery.

## Dependency injection

No container, no singleton beans — `Depends()` means "call this function first, inject its return value." Dependencies chain (`app/deps.py`):

```
get_db()              → yields a DB session, closes it after the request
get_optional_user()   → reads X-User-Id header, loads the user or None
get_current_user()    → 401s if no user
get_current_owner()   → 403s if user.role != owner
```

A route declares what it needs as parameters, and FastAPI resolves the chain before the function body runs:

```python
def create_property(payload: PropertyCreate, db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
```

`payload` is validated against `PropertyCreate` automatically (400 on mismatch); `db` is a fresh session; `owner` is guaranteed to be a logged-in owner. No `@Valid`, no `@PreAuthorize`.

`get_db()` (`app/database.py`) is the session-per-request pattern — closest to a request-scoped `EntityManager`. There's no `@Transactional`: CRUD functions call `db.commit()` explicitly where needed (see `create_property` in `app/crud/properties.py` — `add()` → `flush()` to get the new id → attach related rows → `commit()`).

## Request lifecycle example

`GET /properties?category_id=1&min_price=50000`:

1. **Router** (`app/routers/properties.py`) — FastAPI parses query params straight into typed function arguments; this replaces `@RequestParam`, `Query(ge=1)` replaces `@Min(1)`.
2. Calls **CRUD** (`app/crud/properties.py`) — builds a SQLAlchemy query, applies filters conditionally, paginates.
3. CRUD returns ORM objects; the router serializes them into plain dicts.
4. FastAPI validates the output against `response_model=...` and serializes to JSON — the Jackson equivalent, declared as a type instead of configured separately.

Swagger docs at `/docs` are generated free from these same type hints and schemas.

## Auth (current state)

Auth is intentionally **plain & minimal** for Stage 1 — no password hashing, no JWT. `deps.py` trusts an `X-User-Id` header the frontend sends after a plain email/password check in `routers/auth.py`. This is not production-secure; a real auth layer later (Stage 2+) would add `passlib` for hashing and `python-jose` for JWTs — closest analogue to plugging in Spring Security.

## Migrations

`alembic/versions/0001_initial_schema.py` creates every table/enum and seeds the fixed taxonomy (10 categories, subtypes). Run the same way you'd run a Flyway migration:

```
alembic upgrade head
```

New schema changes: edit the models, then `alembic revision --autogenerate -m "..."`, review the generated file, then `alembic upgrade head`.
