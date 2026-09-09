# Compatibility entrypoint: the old inline disclosures were replaced by modals.
# Execute through browser-harness stdin from the repository root, with owned BU_NAME.
from pathlib import Path
exec(compile(Path("scripts/qa/modal-browser.py").read_text(), "scripts/qa/modal-browser.py", "exec"))
