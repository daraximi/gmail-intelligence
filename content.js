// content.js - Gmail integration
(function () {
    let analyzer = null;
    let analysisButton = null;
    let currentComposeBox = null;

    // Initialize the analyzer
    async function initAnalyzer() {
        if (!analyzer) {
            analyzer = new EmailSentimentAnalyzer();
            await analyzer.init();
        }
    }

    // Create the analysis button
    function createAnalysisButton() {
        const button = document.createElement('button');
        button.innerHTML = '🎯 Check Tone';
        button.style.cssText = `
        background: #4285f4;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 8px;
      `;
        button.addEventListener('click', handleAnalyzeClick);
        return button;
    }

    // Handle analysis button click
    async function handleAnalyzeClick() {
        const composeBox = findActiveComposeBox();
        if (!composeBox) {
            showMessage('No active email composition found', 'error');
            return;
        }

        const emailText = getEmailText(composeBox);
        if (!emailText.trim()) {
            showMessage('Email appears to be empty', 'warning');
            return;
        }

        // Show loading state
        analysisButton.textContent = '⏳ Analyzing...';
        analysisButton.disabled = true;

        try {
            await initAnalyzer();

            // Test backend connection first
            const connectionTest = await analyzer.testConnection();
            // if (connectionTest.status === 'error') {
            //     throw new Error(
            //         `Backend connection failed: ${connectionTest.message}`
            //     );
            // }

            const result = await analyzer.analyzeEmail(emailText);

            // Only call suggestions if analysis was successful
            let improvedEmail = null;
            try {
                improvedEmail = await analyzer.suggestImprovements(
                    emailText,
                    result
                );
            } catch (suggestionError) {
                console.warn(
                    'Suggestions failed, continuing with analysis only:',
                    suggestionError
                );
                // Don't fail the entire flow if suggestions fail
            }

            showAnalysisResult(result, improvedEmail);

            // Update usage stats
            updateUsageStats('emailAnalyzed');
        } catch (error) {
            console.error('Analysis failed:', error);
            let errorMessage = error.message;

            // Provide more user-friendly error messages
            if (error.message.includes('Network error')) {
                errorMessage =
                    'Unable to connect to backend. Please check your internet connection and try again.';
            } else if (error.message.includes('Backend error')) {
                errorMessage = 'Backend service error. Please try again later.';
            } else if (error.message.includes('API key')) {
                errorMessage =
                    'API key issue. Please check your configuration.';
            }

            showMessage(`Analysis failed: ${errorMessage}`, 'error');
        } finally {
            analysisButton.textContent = '🎯 Check Tone';
            analysisButton.disabled = false;
        }
    }

    // Find the active compose box
    function findActiveComposeBox() {
        // Gmail's compose box selectors
        const selectors = [
            '[role="textbox"][contenteditable="true"]', // Main compose area
            '.Am.Al.editable', // Alternative Gmail selector
            'div[aria-label="Message Body"]', // Another possible selector
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
                // Check if visible
                return element;
            }
        }
        return null;
    }

    // Extract text from email compose box
    function getEmailText(composeBox) {
        return composeBox.innerText || composeBox.textContent || '';
    }

    // Show analysis results
    function showAnalysisResult(result, improvedEmail) {
        // Remove any existing result panel
        const existingPanel = document.getElementById('sentiment-result-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'sentiment-result-panel';
        panel.style.cssText = `
        position: fixed;
        top: 50px;
        right: 20px;
        width: 350px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 16px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
      `;

        const riskColor = getRiskColor(result.riskLevel);

        panel.innerHTML = `
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #333;">Email Tone Analysis</h3>
          <button id="close-panel" style="background: none; border: none; font-size: 16px; cursor: pointer;">✕</button>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>Sentiment:</strong> <span style="color: ${getSentimentColor(
              result.sentiment
          )}">${result.sentiment}</span>
          <br><strong>Tone:</strong> ${result.tone}
          <br><strong>Risk Level:</strong> <span style="color: ${riskColor}; font-weight: bold;">${
            result.riskLevel
        }</span>
        </div>
  
        ${
            result.issues && result.issues.length > 0
                ? `
          <div style="margin-bottom: 12px;">
            <strong>Potential Issues:</strong>
            <ul style="margin: 4px 0; padding-left: 20px;">
              ${result.issues.map((issue) => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
        `
                : ''
        }
  
        ${
            result.suggestions && result.suggestions.length > 0
                ? `
          <div style="margin-bottom: 12px;">
            <strong>Suggestions:</strong>
            <ul style="margin: 4px 0; padding-left: 20px;">
              ${result.suggestions
                  .map((suggestion) => `<li>${suggestion}</li>`)
                  .join('')}
            </ul>
          </div>
        `
                : ''
        }
  
        ${
            improvedEmail
                ? `
          <div style="margin-bottom: 12px;">
            <strong>Suggested Rewrite:</strong>
            <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin-top: 4px; font-style: italic;">
              ${improvedEmail.improvedEmail}
            </div>
            </div>
            <style>
#apply-rewrite {
  background: linear-gradient(135deg, #34a853 0%, #2d8e47 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(52, 168, 83, 0.2);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

#apply-rewrite:hover {
  background: linear-gradient(135deg, #2d8e47 0%, #1e5c2f 100%);
  box-shadow: 0 4px 8px rgba(52, 168, 83, 0.3);
  transform: translateY(-1px);
}

#apply-rewrite:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(52, 168, 83, 0.2);
}

#apply-rewrite:before {
  content: '✏️';
  margin-right: 6px;
}
</style>
<button id="apply-rewrite">Apply Rewrite</button>
        `
                : ''
        }
      `;

        document.body.appendChild(panel);

        // Add close functionality
        document.getElementById('close-panel').addEventListener('click', () => {
            panel.remove();
        });

        // Add apply rewrite functionality
        document
            .getElementById('apply-rewrite')
            .addEventListener('click', () => {
                applyRewrite(improvedEmail.improvedEmail);
            });

        // Auto-close after 30 seconds
        setTimeout(() => {
            if (panel.parentNode) {
                panel.remove();
            }
        }, 30000);
    }

    // Helper functions for colors
    function getSentimentColor(sentiment) {
        const colors = {
            positive: '#4caf50',
            negative: '#f44336',
            neutral: '#757575',
            mixed: '#ff9800',
        };
        return colors[sentiment] || '#757575';
    }

    function getRiskColor(riskLevel) {
        const colors = {
            low: '#4caf50',
            medium: '#ff9800',
            high: '#f44336',
        };
        return colors[riskLevel] || '#757575';
    }

    // Apply the rewritten text to the compose box
    function applyRewrite(improvedText) {
        const composeBox = findActiveComposeBox();
        if (!composeBox) {
            showMessage('Could not find compose box to apply rewrite', 'error');
            return;
        }

        try {
            // Store the current cursor position if possible
            const selection = window.getSelection();
            const range =
                selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

            // Clear the current content
            composeBox.innerHTML = '';

            // Set the new content
            // For Gmail's rich text editor, we need to handle both plain text and HTML
            if (composeBox.contentEditable === 'true') {
                // Convert line breaks to <br> tags for HTML content
                const htmlContent = improvedText.replace(/\n/g, '<br>');
                composeBox.innerHTML = htmlContent;
            } else {
                composeBox.textContent = improvedText;
            }

            // Trigger input events so Gmail knows the content changed
            const inputEvent = new Event('input', { bubbles: true });
            composeBox.dispatchEvent(inputEvent);

            const changeEvent = new Event('change', { bubbles: true });
            composeBox.dispatchEvent(changeEvent);

            // Focus the compose box and place cursor at the end
            composeBox.focus();

            // Place cursor at the end of the content
            if (window.getSelection && document.createRange) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(composeBox);
                range.collapse(false); // Collapse to end
                selection.removeAllRanges();
                selection.addRange(range);
            }

            showMessage('Email rewritten successfully!', 'info');

            // Update usage stats
            updateUsageStats('rewriteApplied');
        } catch (error) {
            console.error('Error applying rewrite:', error);
            showMessage(
                'Error applying rewrite. You can copy-paste manually.',
                'error'
            );
        }
    }

    // Update usage statistics
    async function updateUsageStats(action) {
        try {
            const result = await chrome.storage.sync.get([
                'emailsAnalyzed',
                'issuesFound',
                'rewritesApplied',
            ]);
            const stats = {
                emailsAnalyzed: result.emailsAnalyzed || 0,
                issuesFound: result.issuesFound || 0,
                rewritesApplied: result.rewritesApplied || 0,
            };

            if (action === 'emailAnalyzed') {
                stats.emailsAnalyzed++;
            } else if (action === 'issueFound') {
                stats.issuesFound++;
            } else if (action === 'rewriteApplied') {
                stats.rewritesApplied++;
            }

            await chrome.storage.sync.set(stats);
        } catch (error) {
            console.error('Error updating usage stats:', error);
        }
    }
    function showMessage(message, type = 'info') {
        const colors = {
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3',
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        z-index: 10001;
        font-family: Arial, sans-serif;
      `;
        toast.textContent = message;

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Add the analysis button to Gmail's toolbar
    function addAnalysisButton() {
        // Look for Gmail's send button area to place our button nearby
        const sendButton = document.querySelector(
            '[role="button"][data-tooltip*="Send"]'
        );
        if (sendButton && !document.querySelector('#sentiment-analysis-btn')) {
            analysisButton = createAnalysisButton();
            analysisButton.id = 'sentiment-analysis-btn';

            const toolbar =
                sendButton.closest('[role="toolbar"]') || sendButton.parentNode;
            if (toolbar) {
                toolbar.appendChild(analysisButton);
            }
        }
    }

    // Watch for Gmail compose windows opening
    function observeGmail() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    // Check if a compose window was added
                    setTimeout(() => {
                        addAnalysisButton();
                    }, 1000); // Small delay to ensure Gmail UI is ready
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(observeGmail, 2000);
        });
    } else {
        setTimeout(observeGmail, 2000);
    }

    // Also try to add button immediately if compose is already open
    setTimeout(addAnalysisButton, 3000);
})();
