// APIキーの種類を判定
function detectApiType(apiKey) {
    const key = apiKey.trim();

    // OpenAI (GPT): sk-... (sk-ant-以外)
    if (key.startsWith('sk-') && !key.startsWith('sk-ant-')) {
        return {
            type: 'openai',
            name: 'OpenAI (GPT)',
            badgeClass: 'badge-openai'
        };
    }

    // Anthropic (Claude): sk-ant-...
    if (key.startsWith('sk-ant-')) {
        return {
            type: 'anthropic',
            name: 'Anthropic (Claude)',
            badgeClass: 'badge-anthropic'
        };
    }

    // Google (Gemini): AIza... (39文字程度)
    if (key.startsWith('AIza') && key.length >= 35 && key.length <= 45) {
        return {
            type: 'gemini',
            name: 'Google (Gemini)',
            badgeClass: 'badge-gemini'
        };
    }

    return {
        type: 'unknown',
        name: '不明',
        badgeClass: 'badge-unknown'
    };
}

// OpenAI API有効性チェック
async function validateOpenAI(apiKey) {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const modelCount = data.data?.length || 0;
            return {
                valid: true,
                message: `有効なAPIキーです。${modelCount}個のモデルにアクセス可能。`
            };
        } else if (response.status === 401) {
            return {
                valid: false,
                message: '無効なAPIキーです。'
            };
        } else if (response.status === 429) {
            return {
                valid: true,
                message: 'APIキーは有効です（レート制限中）。'
            };
        } else {
            const error = await response.json().catch(() => ({}));
            return {
                valid: false,
                message: error.error?.message || `エラー: ${response.status}`
            };
        }
    } catch (error) {
        return {
            valid: false,
            message: `接続エラー: ${error.message}`
        };
    }
}

// Anthropic API有効性チェック
async function validateAnthropic(apiKey) {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'Hi' }]
            })
        });

        if (response.ok) {
            return {
                valid: true,
                message: '有効なAPIキーです。Claude APIにアクセス可能。'
            };
        } else if (response.status === 401) {
            return {
                valid: false,
                message: '無効なAPIキーです。'
            };
        } else if (response.status === 429) {
            return {
                valid: true,
                message: 'APIキーは有効です（レート制限中）。'
            };
        } else if (response.status === 400) {
            const error = await response.json().catch(() => ({}));
            // 400エラーでも認証が通っていれば有効
            if (error.error?.type === 'invalid_request_error') {
                return {
                    valid: true,
                    message: 'APIキーは有効です。'
                };
            }
            return {
                valid: false,
                message: error.error?.message || `エラー: ${response.status}`
            };
        } else {
            const error = await response.json().catch(() => ({}));
            return {
                valid: false,
                message: error.error?.message || `エラー: ${response.status}`
            };
        }
    } catch (error) {
        return {
            valid: false,
            message: `接続エラー: ${error.message}`
        };
    }
}

// Gemini API有効性チェック
async function validateGemini(apiKey) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: 'GET' }
        );

        if (response.ok) {
            const data = await response.json();
            const modelCount = data.models?.length || 0;
            return {
                valid: true,
                message: `有効なAPIキーです。${modelCount}個のモデルにアクセス可能。`
            };
        } else if (response.status === 400 || response.status === 403) {
            const error = await response.json().catch(() => ({}));
            return {
                valid: false,
                message: error.error?.message || '無効なAPIキーです。'
            };
        } else if (response.status === 429) {
            return {
                valid: true,
                message: 'APIキーは有効です（レート制限中）。'
            };
        } else {
            const error = await response.json().catch(() => ({}));
            return {
                valid: false,
                message: error.error?.message || `エラー: ${response.status}`
            };
        }
    } catch (error) {
        return {
            valid: false,
            message: `接続エラー: ${error.message}`
        };
    }
}

// 結果を表示
function showResult(type, title, details, apiInfo) {
    const resultBox = document.getElementById('resultBox');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultDetails = document.getElementById('resultDetails');

    resultBox.className = `result-box show ${type}`;

    const icons = {
        success: '✓',
        error: '✗',
        warning: '?'
    };

    resultIcon.textContent = icons[type] || '•';
    resultTitle.innerHTML = `<span class="api-badge ${apiInfo.badgeClass}">${apiInfo.name}</span> ${title}`;
    resultDetails.textContent = details;
}

// メイン検証関数
async function validateApiKey() {
    const apiKeyInput = document.getElementById('apiKey');
    const validateBtn = document.getElementById('validateBtn');
    const resultBox = document.getElementById('resultBox');

    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        alert('APIキーを入力してください。');
        return;
    }

    // 検証中の表示
    validateBtn.disabled = true;
    validateBtn.innerHTML = '<div class="loading"><div class="spinner"></div>...</div>';
    resultBox.className = 'result-box';

    // APIの種類を判定
    const apiInfo = detectApiType(apiKey);

    let result;

    if (apiInfo.type === 'unknown') {
        result = {
            valid: null,
            message: 'APIキーの形式が認識できません。sk-... / sk-ant-... / AIza... の形式で入力してください。'
        };
    } else {
        switch (apiInfo.type) {
            case 'openai':
                result = await validateOpenAI(apiKey);
                break;
            case 'anthropic':
                result = await validateAnthropic(apiKey);
                break;
            case 'gemini':
                result = await validateGemini(apiKey);
                break;
        }
    }

    // 結果を表示
    if (result.valid === true) {
        showResult('success', '有効', result.message, apiInfo);
    } else if (result.valid === false) {
        showResult('error', '無効', result.message, apiInfo);
    } else {
        showResult('warning', '確認不可', result.message, apiInfo);
    }

    // ボタンを元に戻す
    validateBtn.disabled = false;
    validateBtn.textContent = 'チェック';
}

// クリア
function clearAll() {
    document.getElementById('apiKey').value = '';
    document.getElementById('resultBox').className = 'result-box';
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('validateBtn').addEventListener('click', validateApiKey);
    document.getElementById('clearBtn').addEventListener('click', clearAll);

    document.getElementById('apiKey').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateApiKey();
        }
    });
});
