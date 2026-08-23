from pathlib import Path
from io import BytesIO

from docx import Document
from pypdf import PdfReader


def extract_resume_text(file_bytes: bytes, filename: str) -> str:
    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        reader = PdfReader(BytesIO(file_bytes))

        text = "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        )

    elif extension == ".docx":
        document = Document(BytesIO(file_bytes))

        text = "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        )

    else:
        raise ValueError("Unsupported resume format. Use PDF or DOCX.")

    text = text.strip()

    if not text:
        raise ValueError("Could not extract any text from the resume.")

    return text