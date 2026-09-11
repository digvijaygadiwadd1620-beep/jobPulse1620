#!/usr/bin/env python3
"""
JobPulse Python Web API Server (Standard Library HTTP / Flask compatible)
Serves JobPulse REST endpoints natively in Python.
"""
import sys
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
from jobpulse_engine import (
    init_db, seed_sample_jobs, seed_default_resume,
    run_scan_and_match, get_matches, get_stats,
    update_match_status, save_resume_profile,
    send_telegram_alert, save_alert_config
)

PORT = int(os.environ.get("PYTHON_PORT", 5002))

class JobPulseHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/stats":
            self._send_json(get_stats())
        elif path == "/api/matches" or path == "/api/jobs":
            filters = {k: v[0] for k, v in query.items()}
            self._send_json(get_matches(filters))
        elif path == "/api/health":
            self._send_json({"status": "healthy", "service": "JobPulse Python Engine"})
        else:
            self._send_json({"error": "Not Found"}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('content-length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
        try:
            payload = json.loads(body)
        except:
            payload = {}

        if path == "/api/jobs/scan" or path == "/api/scan":
            res = run_scan_and_match(payload.get("resume_id"))
            self._send_json(res)
        elif path == "/api/resume":
            res = save_resume_profile(payload)
            self._send_json(res)
        elif path == "/api/alerts/telegram/test":
            res = send_telegram_alert(
                payload.get("bot_token"),
                payload.get("chat_id"),
                payload.get("message", "🎯 JobPulse Alert Test")
            )
            self._send_json(res)
        elif path == "/api/alerts/config":
            res = save_alert_config(payload)
            self._send_json(res)
        else:
            self._send_json({"error": "Not Found"}, status=404)

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('content-length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
        try:
            payload = json.loads(body)
        except:
            payload = {}

        if path.startswith("/api/matches/"):
            match_id = path.split("/")[-1]
            res = update_match_status(
                match_id,
                status=payload.get("status"),
                notes=payload.get("notes"),
                interview_date=payload.get("interview_date"),
                salary_offered=payload.get("salary_offered")
            )
            self._send_json(res)
        else:
            self._send_json({"error": "Not Found"}, status=404)

def run_server():
    init_db()
    seed_sample_jobs()
    seed_default_resume()
    run_scan_and_match()
    server = HTTPServer(("0.0.0.0", PORT), JobPulseHandler)
    print(f"JobPulse Python Backend running on port {PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    run_server()
