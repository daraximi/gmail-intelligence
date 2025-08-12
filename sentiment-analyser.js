class EmailSentimentAnalyzer {
    constructor() {
        this.apiKey = null;
        this.init();
    }
    async init() {
        this.apiKey = 'OLUWADARASIMI2025$$';
    }

    async analyzeEmail(emailText) {
        if (!this.apiKey) {
            throw new Error('API key not found');
        }
        try {
            const response = await fetch('https://localhost:3000/analyse', {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailText: emailText,
                }),
            });
            if (!response.ok) {
                console.log(response);
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            //console.log(data);
            const analysis = JSON.parse(data.output[1].content[0].text);
            //console.log(analysis);

            return analysis;
        } catch (error) {
            console.error('Error analyzing email:', error);
            throw error;
        }
    }
    async suggestImprovements(emailText, analysisResult) {
        try {
            const response = await fetch('https://localhost:3000/suggest', {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailText: emailText,
                    analysisResult: analysisResult,
                }),
            });

            const data = await response.json();
            const improvedEmail = data.output[1].content[0].text;
            return improvedEmail;
        } catch (error) {
            console.error('Error getting suggestions:', error);
            throw error;
        }
    }
}
