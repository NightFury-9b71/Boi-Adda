from sqlmodel import create_engine, Session, SQLModel

url = "sqlite:///boi_adda.db"
engine = create_engine(url, echo=True)

def create_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
