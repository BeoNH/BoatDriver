#!/bin/sh
# Gọi tool funplay-cocos-mcp trực tiếp qua HTTP khi MCP chưa nạp vào session.
# Cần Cocos Creator đang mở project này (extension autostart, port 21458).
# Dùng: sh .claude/tools/mcp.sh <tool_name> '<json args>'   |   sh .claude/tools/mcp.sh --list
if [ "$1" = "--list" ]; then
  BODY='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
else
  BODY="{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$1\",\"arguments\":${2:-{\}}}}"
fi
curl -s -m "${MCP_TIMEOUT:-60}" -H 'Content-Type: application/json' -H 'Accept: application/json,text/event-stream' \
  -X POST "http://127.0.0.1:${MCP_PORT:-21458}/mcp" -d "$BODY"
