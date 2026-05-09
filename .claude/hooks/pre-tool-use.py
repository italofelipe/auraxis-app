#!/usr/bin/env python3
"""
auraxis-app pre-tool-use hook.
Bloqueia operações perigosas e enforça guardrails para agentes autônomos.
"""
from __future__ import annotations
import json, re, sys

def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    if tool_name == "Bash":
        _check_bash(tool_input.get("command", ""))
    elif tool_name in ("Write", "Edit"):
        content = tool_input.get("content", "") or tool_input.get("new_string", "")
        _check_file_write(tool_input.get("file_path", ""), content=content)

def _check_bash(command: str) -> None:
    hard_blocks = [
        (r"git add \.(\s|$)", "BLOQUEADO: 'git add .' proibido. Use: git add <arquivo>"),
        (r"git add -A(\s|$)", "BLOQUEADO: 'git add -A' proibido. Use: git add <arquivo>"),
        (r"git add --all(\s|$)", "BLOQUEADO: 'git add --all' proibido."),
        (r"git push --force", "BLOQUEADO: push --force requer aprovação humana."),
        (r"git push -f(\s|$)", "BLOQUEADO: push -f requer aprovação humana."),
        (r"git commit --no-verify", "BLOQUEADO: --no-verify pula quality gates obrigatórios."),
        (r"git commit -n(\s|$)", "BLOQUEADO: -n pula quality gates."),
        (r"git push\s+(\S+\s+)?(main|master)(\s|$)", "BLOQUEADO: push direto para main/master. Use PR."),
    ]
    soft_warns = [
        (r"git reset --hard", "AVISO: git reset --hard é destrutivo."),
        (r"git clean -f", "AVISO: git clean -f remove arquivos permanentemente."),
        (r"rm -rf", "AVISO: rm -rf é destrutivo."),
        (r"expo prebuild", "AVISO: expo prebuild regenera native dirs. Confirme se necessário."),
        (r"npx expo install.*--fix", "AVISO: --fix pode atualizar dependências nativas e exigir rebuild."),
    ]
    for pattern, msg in hard_blocks:
        if re.search(pattern, command):
            print(msg, file=sys.stderr)
            sys.exit(2)
    for pattern, msg in soft_warns:
        if re.search(pattern, command):
            print(msg, file=sys.stderr)

_ENV_FILE_RE = re.compile(r"(^|/)\.env(?:\.(?!example$)[\w.-]+)?$")
_SENSITIVE = ("secrets.", "credentials.")
_CONTRACT_PATHS = ("contracts/", "openapi.json", "openapi.yaml")
_COVERAGE_CONFIGS = ("jest.config.js", "jest.config.ts", "package.json")
_NATIVE_CONFIGS = ("app.json", "app.config.js", "eas.json")
_TEST_DISABLE = ("skip(", "xit(", "xtest(", "xdescribe(")

def _check_file_write(file_path: str, content: str = "") -> None:
    for s in _SENSITIVE:
        if s in file_path:
            print(f"BLOQUEADO: escrita em '{file_path}' proibida (secrets).", file=sys.stderr)
            sys.exit(2)
    if _ENV_FILE_RE.search(file_path):
        print(f"BLOQUEADO: escrita em '{file_path}' proibida (.env).", file=sys.stderr)
        sys.exit(2)
    is_test = file_path.endswith((".spec.ts", ".test.ts", ".spec.tsx", ".test.tsx"))
    if is_test and content:
        for dp in _TEST_DISABLE:
            if dp in content and "// reason:" not in content:
                print(f"BLOQUEADO: '{dp}' sem justificativa em '{file_path}'. Use // reason:", file=sys.stderr)
                sys.exit(2)
    for p in _NATIVE_CONFIGS:
        if file_path.endswith(p):
            print(f"AVISO: editando '{file_path}' — afeta build nativo. Verifique impacto em EAS.", file=sys.stderr)
    for p in _CONTRACT_PATHS:
        if p in file_path:
            print(f"AVISO: editando contrato '{file_path}'. Rode npm run contracts:check após.", file=sys.stderr)
    for p in _COVERAGE_CONFIGS:
        if file_path.endswith(p):
            print(f"AVISO: editando config de qualidade '{file_path}'. Não reduza threshold de 85%.", file=sys.stderr)

if __name__ == "__main__":
    main()
