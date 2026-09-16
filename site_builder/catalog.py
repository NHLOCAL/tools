"""Read the public catalog from README without duplicating tool metadata."""

from dataclasses import dataclass
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TOOL_PATTERN = re.compile(r"^-\s*\[(.*?)\]\((.*?)\)\s*-\s*(.*)$")


@dataclass(frozen=True)
class Category:
    key: str
    title: str
    icon: str
    description: str

    @property
    def page(self):
        return f"catalog/{self.key}.html"


CATEGORIES = (
    Category("skill", "סקילים", "zap", "ידע, הוראות וכלים שמרחיבים את היכולות של עוזרי AI"),
    Category("web", "כלי דפדפן", "monitor", "פותחים בדפדפן ומתחילים ליצור, לערוך ולחקור"),
    Category("script", "סקריפטים", "code", "פעולות קטנות למחשב שחוסכות עבודה ידנית"),
    Category("extension", "תוספי כרום", "package", "יכולות נוספות שנמצאות במרחק לחיצה מסרגל הדפדפן"),
)


def classify_tool_section(title):
    lower = title.lower()
    for words, result in (
        (("דפדפן",), ("web", "monitor")),
        (("scripts", "סקריפטים"), ("script", "code")),
        (("extension", "תוספי"), ("extension", "package")),
        (("skill", "סקיל"), ("skill", "zap")),
    ):
        if any(word in lower for word in words):
            return result
    return "other", "tool"


@dataclass(frozen=True)
class Tool:
    name: str
    path: str
    description: str
    category: str
    id: str
    is_directory: bool
    has_resources: bool

    @property
    def filename(self):
        return self.path.rstrip("/").split("/")[-1]


def parse_tool(line, category, root=ROOT):
    match = TOOL_PATTERN.match(line.strip())
    if not match:
        raise ValueError(f"Invalid catalog entry: {line}")
    name, path, description = (part.strip() for part in match.groups())
    target = (root / path).resolve()
    if not target.is_relative_to(root.resolve()) or not target.exists():
        raise ValueError(f"Catalog path must exist inside the repository: {path}")
    directory = target.is_dir()
    filename = path.rstrip("/").split("/")[-1]
    # Keep existing public #anchors, including Hebrew names and version numbers.
    tool_id = filename.rsplit(".", 1)[0] if "." in filename and not directory else filename
    return Tool(name, path, description, category, tool_id, directory,
                (root / "resources" / tool_id).is_dir())


def read_catalog(root=ROOT):
    tools = []
    category = None
    for line in (root / "README.md").read_text(encoding="utf-8").splitlines():
        if re.match(r"^#{2,3}\s", line):
            category, _ = classify_tool_section(line.lstrip("# "))
        elif TOOL_PATTERN.match(line.strip()):
            if category == "other" or category is None:
                continue
            tools.append(parse_tool(line, category, root))
    ids = [tool.id for tool in tools]
    if len(ids) != len(set(ids)):
        raise ValueError("Catalog contains duplicate public anchors")
    return tools
