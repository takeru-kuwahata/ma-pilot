#!/bin/bash

# MA-Pilot Backend Test Runner
# バックエンドテスト実行スクリプト

set -e

echo "========================================="
echo "MA-Pilot Backend Test Suite"
echo "========================================="
echo ""

# 仮想環境のアクティベート
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
else
    echo "Error: Virtual environment not found. Please run 'python -m venv venv' first."
    exit 1
fi

# 依存関係チェック
echo "Checking dependencies..."
pip install -q -r requirements.txt

echo ""
echo "Running tests..."
echo ""

# デフォルト: 全テスト実行（カバレッジ付き）
if [ -z "$1" ]; then
    pytest -v --cov=src --cov-report=term-missing --cov-report=html
# 特定のテストファイル実行
elif [ "$1" == "-f" ] && [ -n "$2" ]; then
    pytest -v tests/test_$2.py
# 特定のテストクラス実行
elif [ "$1" == "-c" ] && [ -n "$2" ]; then
    pytest -v -k "$2"
# カバレッジなしで実行
elif [ "$1" == "--no-cov" ]; then
    pytest -v
# ヘルプ表示
elif [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Usage: ./run_tests.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  (no options)        Run all tests with coverage"
    echo "  -f <filename>       Run specific test file (e.g., -f auth)"
    echo "  -c <classname>      Run specific test class (e.g., -c TestLogin)"
    echo "  --no-cov           Run tests without coverage"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run_tests.sh                    # Run all tests"
    echo "  ./run_tests.sh -f auth            # Run auth tests"
    echo "  ./run_tests.sh -c TestLogin       # Run TestLogin class"
    echo "  ./run_tests.sh --no-cov           # Run without coverage"
else
    echo "Invalid option. Use -h or --help for usage information."
    exit 1
fi

echo ""
echo "========================================="
echo "Test execution completed!"
echo "========================================="
echo ""
echo "Coverage report: htmlcov/index.html"
