#!/usr/bin/env bash
# find-docs.sh — Locate documentation files relevant to the current task.
#
# Usage:
#   ./find-docs.sh            Print locations for common doc targets
#   ./find-docs.sh daily      Print path to latest daily log
#   ./find-docs.sh report     Print path for a new report (today's date folder)
#   ./find-docs.sh service    Print service-level doc locations (requires being in a service dir)

set -euo pipefail

TODAY=$(date +%Y-%m-%d)
DOCS_ROOT="docs"

# Find repo root (walk up until we find a docs/ directory or .git)
find_repo_root() {
    local dir="$PWD"
    while [[ "$dir" != "/" ]]; do
        if [[ -d "$dir/docs" || -d "$dir/.git" ]]; then
            echo "$dir"
            return
        fi
        dir="$(dirname "$dir")"
    done
    echo "$PWD"
}

REPO_ROOT=$(find_repo_root)

print_separator() {
    echo "────────────────────────────────────────────────"
}

cmd="${1:-all}"

case "$cmd" in

    daily)
        DAILY_DIR="$REPO_ROOT/$DOCS_ROOT/daily"
        if [[ -d "$DAILY_DIR" ]]; then
            LATEST=$(ls "$DAILY_DIR" | sort | tail -1)
            echo "Latest daily log: $DAILY_DIR/$LATEST"
            echo ""
            echo "Append with:"
            echo "  echo '- Your log entry here' >> $DAILY_DIR/$LATEST"
        else
            echo "No docs/daily/ directory found in repo root: $REPO_ROOT"
            echo "Create it with: mkdir -p $REPO_ROOT/$DOCS_ROOT/daily"
        fi
        ;;

    report)
        REPORT_DIR="$REPO_ROOT/$DOCS_ROOT/reports/$TODAY"
        echo "New report location: $REPORT_DIR/"
        echo ""
        echo "Create with:"
        echo "  mkdir -p $REPORT_DIR"
        echo "  touch $REPORT_DIR/report-name.md"
        ;;

    service)
        # Look for the nearest service-level directory
        CURRENT="$PWD"
        echo "Service docs for: $CURRENT"
        echo ""
        echo "Expected files:"
        echo "  $CURRENT/README.md      — What it does, when to use it"
        echo "  $CURRENT/ARCHITECTURE.md — How it works internally"
        echo "  $CURRENT/TESTS.md       — Testing patterns"
        echo ""
        echo "Existing:"
        for f in README.md ARCHITECTURE.md TESTS.md SETUP.md OVERVIEW.md FAQ.md CHANGELOG.md; do
            if [[ -f "$CURRENT/$f" ]]; then
                echo "  ✓ $f"
            else
                echo "  ✗ $f (missing)"
            fi
        done
        ;;

    all|*)
        print_separator
        echo "Code Documentation — File Locations"
        print_separator
        echo ""

        # Daily logs
        DAILY_DIR="$REPO_ROOT/$DOCS_ROOT/daily"
        echo "📓 DAILY LOGS"
        if [[ -d "$DAILY_DIR" ]]; then
            LATEST=$(ls "$DAILY_DIR" 2>/dev/null | sort | tail -1)
            if [[ -n "$LATEST" ]]; then
                echo "   Latest: $DAILY_DIR/$LATEST"
            else
                echo "   Directory exists but is empty: $DAILY_DIR"
            fi
        else
            echo "   Not found — expected: $DAILY_DIR/"
        fi
        echo ""

        # Reports
        echo "📊 REPORTS"
        echo "   New report: $REPO_ROOT/$DOCS_ROOT/reports/$TODAY/"
        if [[ -d "$REPO_ROOT/$DOCS_ROOT/reports" ]]; then
            RECENT=$(ls "$REPO_ROOT/$DOCS_ROOT/reports" 2>/dev/null | sort | tail -3)
            if [[ -n "$RECENT" ]]; then
                echo "   Recent:"
                echo "$RECENT" | while read -r d; do
                    echo "     $REPO_ROOT/$DOCS_ROOT/reports/$d/"
                done
            fi
        fi
        echo ""

        # Plans
        echo "📋 PLANS"
        echo "   New plan: $REPO_ROOT/$DOCS_ROOT/plans/$TODAY-feature-name.md"
        echo ""

        # Changelog
        echo "📢 CHANGELOG"
        echo "   Customer-facing: $REPO_ROOT/$DOCS_ROOT/changelog/$TODAY/"
        echo ""

        # Service docs (if in a service dir)
        if [[ "$PWD" == *"/services/"* ]]; then
            SERVICE_ROOT=$(echo "$PWD" | sed 's|\(.*services/[^/]*\).*|\1|')
            echo "🔧 SERVICE DOCS (detected: $SERVICE_ROOT)"
            for f in README.md ARCHITECTURE.md TESTS.md; do
                if [[ -f "$SERVICE_ROOT/$f" ]]; then
                    echo "   ✓ $SERVICE_ROOT/$f"
                else
                    echo "   ✗ $SERVICE_ROOT/$f (missing)"
                fi
            done
            echo ""
        fi

        print_separator
        echo "Templates: .agents/skills/code-documentation/templates/"
        print_separator
        ;;
esac
