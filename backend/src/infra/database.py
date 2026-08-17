from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://setu:setu_pass@localhost:5432/setu_db")
TS_DATABASE_URL = os.getenv("TS_DATABASE_URL", "postgresql+asyncpg://setu_ts:setu_ts_pass@localhost:5433/telemetry")

engine = create_async_engine(DATABASE_URL, echo=False)
ts_engine = create_async_engine(TS_DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
TsAsyncSessionLocal = sessionmaker(ts_engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_ts_db():
    async with TsAsyncSessionLocal() as session:
        yield session
