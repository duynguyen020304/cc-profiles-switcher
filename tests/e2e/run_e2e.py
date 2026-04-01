"""
CC Profiles — E2E Test Suite (Playwright + Python)
Connects to running Electron app or uses file:// fallback with mock IPC.
"""

import os
import sys
import time
import subprocess
import json
import socket
from pathlib import Path

from playwright.sync_api import sync_playwright, Page, expect, TimeoutError as PWTimeout

PROJECT_ROOT = Path(r"F:\ClaudeCodeProfileSwitcher\cc-profiles")
OUT_RENDERER = PROJECT_ROOT / "out" / "renderer" / "index.html"
FIXTURES_DIR = PROJECT_ROOT / "tests" / "e2e" / "fixtures"
DEBUG_PORT = 9222
TIMEOUT_MS = 15000
SPINNER_TIMEOUT_MS = 10000


def port_open(port, host="127.0.0.1"):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex((host, port)) == 0


def find_cdp_endpoint(port=DEBUG_PORT):
    try:
        import urllib.request

        resp = urllib.request.urlopen(
            f"http://127.0.0.1:{port}/json/version", timeout=3
        )
        return json.loads(resp.read()).get("webSocketDebuggerUrl")
    except Exception:
        return None


# ── Mock Data Builder ────────────────────────────────────────────────────────
def build_mock_profiles():
    """Build Profile[] from fixture JSON files matching the TS Profile interface."""
    profiles = []
    for fpath in sorted(FIXTURES_DIR.glob("settings_fixture_*.json")):
        name = fpath.stem.replace("settings_", "")
        with open(fpath) as f:
            fdata = json.load(f)
        env = fdata.get("env", {})
        now = int(time.time() * 1000)
        profiles.append(
            {
                "id": name,
                "filename": fpath.name,
                "displayName": f"fixture / {name.replace('fixture_', '')}",
                "baseUrl": env.get("ANTHROPIC_BASE_URL", ""),
                "authTokenHint": (env.get("ANTHROPIC_AUTH_TOKEN", "") or "")[:8] + "..."
                if env.get("ANTHROPIC_AUTH_TOKEN")
                else None,
                "modelHaiku": env.get("ANTHROPIC_DEFAULT_HAIKU_MODEL", ""),
                "modelSonnet": env.get("ANTHROPIC_DEFAULT_SONNET_MODEL", ""),
                "modelOpus": env.get("ANTHROPIC_DEFAULT_OPUS_MODEL", ""),
                "rawJson": json.dumps(fdata, indent=2),
                "lastSeen": now,
                "createdAt": now,
            }
        )
    return profiles


def build_mock_init_script():
    """Return JavaScript that defines window.ccProfiles mock before React loads."""
    mock_profiles = build_mock_profiles()
    # Deep copy for mutation during switches
    return """
    (() => {
        const _profiles = %s;
        let _activeId = 'fixture_alpha';

        function findActive() {
            return _profiles.find(p => p.id === _activeId) || null;
        }

        function clone(p) {
            return JSON.parse(JSON.stringify(p));
        }

        window.ccProfiles = {
            getProfiles: () => Promise.resolve(_profiles.map(clone)),
            getActiveProfile: () => Promise.resolve(clone(findActive())),
            switchProfile: (id) => new Promise((resolve) => {
                setTimeout(() => {
                    _activeId = id;
                    const active = clone(findActive());
                    // Notify listeners
                    window.__ccProfileSwitchedCbs &&
                        window.__ccProfileSwitchedCbs.forEach(cb => cb(active));
                    resolve({ success: true });
                }, 250);
            }),
            refreshProfiles: () => Promise.resolve(_profiles.map(clone)),
            getSwitchHistory: () => Promise.resolve([]),
            onProfileSwitched: (cb) => {
                window.__ccProfileSwitchedCbs =
                    (window.__ccProfileSwitchedCbs || []);
                window.__ccProfileSwitchedCbs.push(cb);
                return () => {
                    window.__ccProfileSwitchedCbs =
                        (window.__ccProfileSwitchedCbs || []).filter(f => f !== cb);
                };
            },
            onProfilesChanged: (cb) => {
                window.__ccProfilesChangedCbs =
                    (window.__ccProfilesChangedCbs || []);
                window.__ccProfilesChangedCbs.push(cb);
                return () => {
                    window.__ccProfilesChangedCbs =
                        (window.__ccProfilesChangedCbs || []).filter(f => f !== cb);
                };
            },
        };
        console.log('[MOCK] ccProfiles API ready, profiles:', _profiles.map(p=>p.id));
    })();
    """ % json.dumps(mock_profiles, indent=0)


# ── E2E Runner ───────────────────────────────────────────────────────────────
class E2ERunner:
    def __init__(self, page):
        self.page = page
        self.results = []

    def _rec(self, tid, name, passed, detail=""):
        icon = "\u2705" if passed else "\u274c"
        self.results.append(
            {
                "id": tid,
                "name": name,
                "status": "PASS" if passed else "FAIL",
                "detail": detail,
            }
        )
        print(f"  {icon} [{tid}] {name}" + (f" \u2014 {detail}" if detail else ""))

    def _spinner_gone(self, pid):
        sel = f'[data-testid="switch-spinner-{pid}"]'
        try:
            self.page.wait_for_selector(sel, state="hidden", timeout=SPINNER_TIMEOUT_MS)
        except PWTimeout:
            pass

    # ── TEST 1 ──
    def test_1(self):
        p = self.page
        ok = True
        d = []
        try:
            p.locator('[data-testid="profile-list"]').wait_for(
                state="visible", timeout=TIMEOUT_MS
            )
            d.append("profile-list visible")
        except Exception as e:
            ok = False
            d.append(f"profile-list missing: {e}")
        try:
            c = p.locator('[data-testid^="profile-card-"]').count()
            assert c >= 2
            d.append(f"{c} cards")
        except Exception as e:
            ok = False
            d.append(f"cards fail: {e}")
        try:
            p.locator('[data-testid="active-profile-detail"]').wait_for(
                state="visible", timeout=TIMEOUT_MS
            )
            d.append("detail visible")
        except Exception as e:
            ok = False
            d.append(f"detail missing: {e}")
        self._rec("test-1", "App launches and renders profile list", ok, "; ".join(d))

    # ── TEST 2 ──
    def test_2(self):
        p = self.page
        ok = True
        d = []
        for tid, text in [
            ("fixture_alpha", "alpha.example.com"),
            ("fixture_beta", "beta.example.com"),
        ]:
            try:
                expect(
                    p.locator(f'[data-testid="profile-card-{tid}-base-url"]')
                ).to_contain_text(text, timeout=TIMEOUT_MS)
                d.append(f"{tid} OK")
            except Exception as e:
                ok = False
                d.append(f"{tid} FAIL: {e}")
        self._rec("test-2", "Profile cards display correct metadata", ok, "; ".join(d))

    # ── TEST 3 ──
    def test_3(self):
        p = self.page
        ok = True
        d = []
        sw = '[data-testid="profile-card-fixture_alpha-switch"]'
        if p.locator(sw).count() > 0:
            try:
                p.click(sw, timeout=TIMEOUT_MS)
                d.append("clicked switch")
            except Exception as e:
                ok = False
                d.append(f"click FAIL: {e}")
            self._spinner_gone("fixture_alpha")
            time.sleep(0.5)
        else:
            d.append("already active (no switch btn)")
        for sel, chk, lbl in [
            ('[data-testid="profile-card-fixture_alpha-active-dot"]', "v", "dot"),
            ('[data-testid="active-profile-name"]', "c:fixture / alpha", "name"),
            ('[data-testid="model-row-base-url"]', "c:alpha.example.com", "base-url"),
            ('[data-testid="model-row-haiku"]', "c:alpha-model", "haiku"),
        ]:
            try:
                loc = p.locator(sel)
                if chk.startswith("v:"):
                    loc.wait_for(state="visible", timeout=TIMEOUT_MS)
                elif chk.startswith("c:"):
                    expect(loc).to_contain_text(chk[2:], timeout=TIMEOUT_MS)
                d.append(f"{lbl} OK")
            except Exception as e:
                ok = False
                d.append(f"{lbl} FAIL: {e}")
        self._rec(
            "test-3", "Switch profile updates active state (alpha)", ok, "; ".join(d)
        )

    # ── TEST 4 ──
    def test_4(self):
        p = self.page
        ok = True
        d = []
        try:
            p.click(
                '[data-testid="profile-card-fixture_beta-switch"]', timeout=TIMEOUT_MS
            )
            d.append("clicked")
        except Exception as e:
            ok = False
            d.append(f"click FAIL: {e}")
        self._spinner_gone("fixture_beta")
        time.sleep(0.5)
        for sel, chk, lbl in [
            ('[data-testid="profile-card-fixture_beta-active-dot"]', "v", "dot"),
            ('[data-testid="active-profile-name"]', "c:fixture / beta", "name"),
            ('[data-testid="model-row-base-url"]', "c:beta.example.com", "base-url"),
        ]:
            try:
                loc = p.locator(sel)
                if chk.startswith("v:"):
                    loc.wait_for(state="visible", timeout=TIMEOUT_MS)
                elif chk.startswith("c:"):
                    expect(loc).to_contain_text(chk[2:], timeout=TIMEOUT_MS)
                d.append(f"{lbl} OK")
            except Exception as e:
                ok = False
                d.append(f"{lbl} FAIL: {e}")
        self._rec("test-4", "Switch to second profile (beta)", ok, "; ".join(d))

    # ── TEST 5 ──
    def test_5(self):
        p = self.page
        ok = True
        d = []
        try:
            p.click('[data-testid="refresh-button"]', timeout=TIMEOUT_MS)
            d.append("clicked refresh")
            time.sleep(1.5)
        except Exception as e:
            ok = False
            d.append(f"click FAIL: {e}")
        try:
            p.locator('[data-testid="profile-list"]').wait_for(
                state="visible", timeout=TIMEOUT_MS
            )
            d.append("list visible")
        except Exception as e:
            ok = False
            d.append(f"list FAIL: {e}")
        try:
            c = p.locator('[data-testid^="profile-card-"]').count()
            if c >= 2:
                d.append(f"cards={c} OK")
            else:
                ok = False
                d.append(f"cards={c} FAIL")
        except Exception as e:
            ok = False
            d.append(f"cards FAIL: {e}")
        self._rec("test-5", "Refresh button works", ok, "; ".join(d))

    # ── TEST 6 ──
    def test_6(self):
        p = self.page
        ok = True
        d = []
        try:
            p.click(
                '[data-testid="profile-card-fixture_alpha-switch"]', timeout=TIMEOUT_MS
            )
            self._spinner_gone("fixture_alpha")
            time.sleep(0.5)
            d.append("switched to alpha")
        except Exception:
            d.append("alpha switch skipped")
        for row in ["haiku", "sonnet", "opus", "base-url"]:
            sel = f'[data-testid="model-row-{row}"]'
            try:
                loc = p.locator(sel)
                loc.wait_for(state="visible", timeout=TIMEOUT_MS)
                txt = loc.inner_text(timeout=TIMEOUT_MS).strip()
                if txt:
                    d.append(f"{row}=\u2713({txt[:30]})")
                else:
                    ok = False
                    d.append(f"{row}=EMPTY")
            except Exception as e:
                ok = False
                d.append(f"{row} FAIL: {e}")
        self._rec(
            "test-6", "Active profile detail shows model mappings", ok, "; ".join(d)
        )

    def run_all(self):
        print("\n\u25b6 Running E2E Tests\n")
        self.test_1()
        self.test_2()
        self.test_3()
        self.test_4()
        self.test_5()
        self.test_6()
        return self.results


# ── Connection Strategies ────────────────────────────────────────────────────
def try_cdp_connect(pw, port=DEBUG_PORT):
    for attempt_ws in [True, False]:
        try:
            if attempt_ws:
                ws = find_cdp_endpoint(port)
                if not ws:
                    continue
                br = pw.chromium.connect_over_cdp(ws)
            else:
                br = pw.chromium.connect_over_cdp(f"http://127.0.0.1:{port}")
            ctx = br.contexts[0]
            pg = ctx.pages[0] if ctx.pages else ctx.new_page()
            return br, pg
        except Exception:
            continue
    return None, None


def launch_electron(pw):
    env = os.environ.copy()
    env["CLAUDE_DIR_OVERRIDE"] = str(FIXTURES_DIR)
    cmd = f"npx electron . --remote-debugging-port={DEBUG_PORT} --no-sandbox"
    proc = subprocess.Popen(
        cmd,
        shell=True,
        cwd=str(PROJECT_ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
    )
    for i in range(20):
        time.sleep(0.5)
        if port_open(DEBUG_PORT):
            break
    else:
        proc.kill()
        return None, None, None
    time.sleep(2)
    try:
        br = pw.chromium.connect_over_cdp(f"http://127.0.0.1:{DEBUG_PORT}")
        ctx = br.contexts[0]
        pg = ctx.pages[0] if ctx.pages else ctx.new_page()
        return br, pg, proc
    except Exception:
        proc.kill()
        return None, None, None


def file_protocol_fallback(pw):
    print(f"\n[STRATEGY-B] file:// protocol with mock IPC: {OUT_RENDERER.name}")
    browser = pw.chromium.launch(
        headless=True, args=["--no-sandbox", "--disable-web-security"]
    )
    ctx = browser.new_context()
    pg = ctx.new_page()
    pg.add_init_script(build_mock_init_script())
    url = f"file:///{OUT_RENDERER.as_posix()}"
    pg.goto(url, wait_until="networkidle", timeout=TIMEOUT_MS)
    print(f"[STRATEGY-B] Loaded: title={pg.title()}, url={pg.url}")
    return browser, pg, None


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  CC Profiles \u2014 E2E Test Suite (Playwright Python)")
    print("=" * 60)
    print(f"  Renderer : {OUT_RENDERER.name}")
    print(f"  Fixtures : {FIXTURES_DIR.name}/")
    print(f"  Port     : {DEBUG_PORT}")

    with sync_playwright() as pw:
        browser = page = proc = strategy = None

        # Strategy 1: CDP to running instance
        if port_open(DEBUG_PORT):
            print("\n[CDP] Port open, connecting...")
            browser, page = try_cdp_connect(pw)
            if browser:
                strategy = "CDP"

        # Strategy 2: Scan ports 9222-9229
        if not browser:
            for p in range(9222, 9230):
                if port_open(p):
                    print(f"[SCAN] Found port {p}")
                    browser, page = try_cdp_connect(pw, p)
                    if browser:
                        strategy = f"CDP:{p}"
                        break

        # Strategy 3: Launch Electron
        if not browser:
            print("\n[LAUNCH] Starting Electron...")
            browser, page, proc = launch_electron(pw)
            if browser:
                strategy = "Launch+CDP"

        # Strategy 4: file:// with mock IPC
        if not browser:
            browser, page, proc = file_protocol_fallback(pw)
            strategy = "File+MockIPC"

        if not browser or not page:
            print("\n\u274c FATAL: Cannot connect or launch app.")
            sys.exit(1)

        print(f"\n🔗 Strategy: {strategy} | URL: {page.url} | Title: {page.title()}")

        # Diagnostics
        out_dir = PROJECT_ROOT / "tests" / "e2e"
        try:
            page.screenshot(path=str(out_dir / "initial-state.png"))
        except Exception:
            pass
        try:
            (out_dir / "initial-dom.html").write_text(page.content(), encoding="utf-8")
        except Exception:
            pass

        # Run tests
        runner = E2ERunner(page)
        results = runner.run_all()

        try:
            page.screenshot(path=str(out_dir / "final-state.png"))
        except Exception:
            pass

        # Summary
        print("\n" + "=" * 60)
        print("  RESULTS SUMMARY")
        print("=" * 60)
        passed = sum(1 for r in results if r["status"] == "PASS")
        failed = len(results) - passed
        for r in results:
            ic = "\u2705" if r["status"] == "PASS" else "\u274c"
            print(f"  {ic} [{r['id']}] {r['name']}")
            if r.get("detail"):
                print(f"      \u2192 {r['detail']}")
        print("-" * 60)
        print(f"  Total: {len(results)} | Passed: {passed} | Failed: {failed}")
        print("=" * 60)

        try:
            browser.close()
        except Exception:
            pass
        if proc:
            try:
                proc.terminate()
            except Exception:
                pass

        sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
