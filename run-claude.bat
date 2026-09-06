@echo off
set ANTHROPIC_AUTH_TOKEN=freecc
set ANTHROPIC_BASE_URL=http://localhost:8082
cd /d "%~dp0"
echo Starting Claude Code CLI connected to Free Claude Code proxy on http://localhost:8082...
claude %*
