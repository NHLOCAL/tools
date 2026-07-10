import importlib.util
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_build():
    spec = importlib.util.spec_from_file_location("site_build", ROOT / "build.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SkillCardTests(unittest.TestCase):
    def setUp(self):
        self.build = load_build()

    def test_skill_section_uses_dedicated_type_and_icon(self):
        self.assertEqual(
            self.build.classify_tool_section("סקילים ל-Codex"), ("skill", "cpu")
        )

    def test_skill_card_contains_only_release_download_and_source_actions(self):
        line = "- [ימות המשיח — טלפוניה](skills/yemot-telephony/) - סקיל מקיף"
        output = self.build.generate_tool_html(line, "skill")
        self.assertIn("releases/latest/download/yemot-telephony.zip", output)
        self.assertIn("tree/main/skills/yemot-telephony/", output)
        self.assertIn("הורד ZIP", output)
        self.assertIn("קוד מקור", output)
        self.assertNotIn("הפעל", output)
        self.assertNotIn("raw.githubusercontent.com", output)
        self.assertNotIn("משאבים", output)


class PackageScriptTests(unittest.TestCase):
    def test_package_is_reproducible_and_has_top_level_skill_folder(self):
        script = ROOT / "scripts" / "package-yemot-telephony.ps1"
        self.assertTrue(script.exists(), f"missing {script}")
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            skill = base / "yemot-telephony"
            (skill / "references").mkdir(parents=True)
            (skill / "__pycache__").mkdir()
            (skill / "SKILL.md").write_text("---\nname: yemot-telephony\n---\n", encoding="utf-8")
            (skill / "references" / "source.md").write_text("source\n", encoding="utf-8")
            (skill / "__pycache__" / "ignored.pyc").write_bytes(b"ignored")
            first = base / "first.zip"
            second = base / "second.zip"
            for output in (first, second):
                result = subprocess.run(
                    [
                        "pwsh",
                        "-NoProfile",
                        "-File",
                        str(script),
                        "-SkillPath",
                        str(skill),
                        "-OutputPath",
                        str(output),
                    ],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    check=False,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(first.read_bytes(), second.read_bytes())
            with zipfile.ZipFile(first) as archive:
                names = archive.namelist()
            self.assertEqual(
                set(names),
                {
                    "yemot-telephony/SKILL.md",
                    "yemot-telephony/references/source.md",
                },
            )

    def test_release_workflow_packages_expected_asset(self):
        workflow = ROOT / ".github" / "workflows" / "release-yemot-telephony.yml"
        self.assertTrue(workflow.exists(), f"missing {workflow}")
        content = workflow.read_text(encoding="utf-8")
        self.assertIn("yemot-telephony-v*", content)
        self.assertIn("yemot-telephony.zip", content)
        self.assertIn("package-yemot-telephony.ps1", content)


if __name__ == "__main__":
    unittest.main()
