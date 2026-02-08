#!/bin/bash
echo '{ "id":"test","timestamp":'$(date +%s000)',"location":"test.sh:1","message":"Logging test","data":{"cwd":"'$(pwd)'"},"runId":"test"}' >> .cursor/debug.log
echo "Log written. Check .cursor/debug.log"
