import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base, TimestampMixin
from app.schemas.filesystem import LocalMountAccessMode

if TYPE_CHECKING:
    from app.models.project import Project


class ProjectLocalMount(Base, TimestampMixin):
    __tablename__ = "project_local_mounts"
    __table_args__ = (
        Index("ix_project_local_mounts_project_id", "project_id"),
        Index(
            "ix_project_local_mounts_project_mount_id",
            "project_id",
            "mount_id",
            unique=True,
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    mount_id: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    host_path: Mapped[str] = mapped_column(Text, nullable=False)
    access_mode: Mapped[LocalMountAccessMode] = mapped_column(
        String(2),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )

    project: Mapped["Project"] = relationship(back_populates="project_local_mounts")
