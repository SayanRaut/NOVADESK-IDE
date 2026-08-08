from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    hashed_password = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    display_name = Column(String)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    last_login = Column(DateTime, nullable=True)
    plan = Column(String, default="Free")
    
    # Preferences
    selected_theme = Column(String, default="dark")
    editor_settings = Column(JSON, default=dict)
    keyboard_shortcuts = Column(JSON, default=dict)
    preferences = Column(JSON, default=dict)
    
    workspaces = relationship("Workspace", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="user")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    user = relationship("User", back_populates="refresh_tokens")

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name = Column(String)
    path = Column(String)
    recent_files = Column(JSON, default=list)
    recent_chats = Column(JSON, default=list)
    opened_tabs = Column(JSON, default=list)
    window_layout = Column(JSON, default=dict)
    terminal_state = Column(JSON, default=dict)
    explorer_state = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    user = relationship("User", back_populates="workspaces")
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    name = Column(String)
    path = Column(String)
    last_opened = Column(DateTime, nullable=True)
    git_branch = Column(String, nullable=True)
    project_settings = Column(JSON, default=dict)
    embeddings_namespace = Column(String, unique=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    workspace = relationship("Workspace", back_populates="projects")
    conversations = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title = Column(String)
    current_agent = Column(String, default="chat")
    summary = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    project = relationship("Project", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    role = Column(String) # 'user' or 'model'
    content = Column(Text)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    conversation = relationship("Conversation", back_populates="messages")



class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String)
    model_used = Column(String, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    credits_used = Column(Integer, default=0)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    provider = Column(String, nullable=True)
    conversation_id = Column(Integer, nullable=True)
    error = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    user = relationship("User", back_populates="analytics")


class IndexedFile(Base):
    """Tracks files that have been embedded into the Memory Engine (Qdrant)."""
    __tablename__ = "indexed_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)     # SHA-256 of file content
    chunk_count = Column(Integer, default=0)
    embedding_version = Column(String, default="text-embedding-004")
    indexed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
