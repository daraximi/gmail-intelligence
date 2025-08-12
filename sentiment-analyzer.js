class EmailSentimentAnalyzer {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://gmail-intelligence-backend.onrender.com';
        this.init();
    }

    async init() {
        this.apiKey = '=OLUWADARASIMI2025';
    }

    async analyzeEmail(emailText) {
        if (!this.apiKey) {
            throw new Error('API key not found');
        }

        if (!emailText || !emailText.trim()) {
            throw new Error('Email text is required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/analyse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'OLUWADARASIMI2025',
                },
                body: JSON.stringify({ emailText }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    'Backend response error:',
                    response.status,
                    errorText
                );
                throw new Error(
                    `Backend error: ${response.status} - ${errorText}`
                );
            }

            const data = await response.json();
            console.log('Analysis data received:', data);

            return data;
        } catch (error) {
            console.error('Error analyzing email:', error);
            if (
                error.name === 'TypeError' &&
                error.message.includes('Failed to fetch')
            ) {
                throw new Error(
                    'Network error: Unable to connect to backend. Please check your internet connection and try again.'
                );
            }
            throw error;
        }
    }

    async suggestImprovements(emailText, analysisResult) {
        if (!emailText || !emailText.trim()) {
            throw new Error('Email text is required for suggestions');
        }

        try {
            const requestBody = {
                emailText: emailText,
                analysisResult: analysisResult || {},
            };

            console.log('Sending suggestion request with body:', requestBody);

            const response = await fetch(`${this.baseUrl}/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'OLUWADARASIMI2025',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    'Suggestion response error:',
                    response.status,
                    errorText
                );
                throw new Error(
                    `Suggestion error: ${response.status} - ${errorText}`
                );
            }

            const data = await response.json();
            console.log('Suggestion data received:', data);

            return data;
        } catch (error) {
            console.error('Error getting suggestions:', error);
            if (
                error.name === 'TypeError' &&
                error.message.includes('Failed to fetch')
            ) {
                throw new Error(
                    'Network error: Unable to connect to backend for suggestions. Please check your internet connection and try again.'
                );
            }
            throw error;
        }
    }

    // Test backend connectivity
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'OLUWADARASIMI2025',
                },
            });
            console.log(response);
        } catch (error) {
            console.log(error);
        }
    }
}
