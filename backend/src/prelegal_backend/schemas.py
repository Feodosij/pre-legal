from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class PartialPartyInfo(BaseModel):
    companyName: str | None = None
    printName: str | None = None
    title: str | None = None
    noticeAddress: str | None = None


class PartialNdaFormData(BaseModel):
    partyOne: PartialPartyInfo | None = None
    partyTwo: PartialPartyInfo | None = None
    purpose: str | None = None
    effectiveDate: str | None = None
    mndaTerm: Literal["expires", "untilTerminated"] | None = None
    mndaTermYears: int | None = None
    confidentialityTerm: Literal["years", "perpetuity"] | None = None
    confidentialityTermYears: int | None = None
    governingLaw: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    documentId: str | None = None
    fields: dict[str, object] = {}


class ChatResponse(BaseModel):
    reply: str
    documentId: str | None
    suggestedDocumentId: str | None = None
    fields: dict[str, object]
    isComplete: bool


class DocumentCreateRequest(BaseModel):
    documentId: str
    fields: dict[str, object] = {}
    isComplete: bool = False


class DocumentUpdateRequest(BaseModel):
    fields: dict[str, object]
    isComplete: bool = False


class DocumentSummary(BaseModel):
    id: int
    documentId: str
    title: str
    isComplete: bool
    createdAt: str
    updatedAt: str


class DocumentResponse(DocumentSummary):
    fields: dict[str, object]
