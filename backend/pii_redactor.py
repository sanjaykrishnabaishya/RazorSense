import re

class PIIRedactor:
    """
    Middleware for redacting Personally Identifiable Information (PII) before it 
    is sent to third-party Cloud LLMs (e.g. OpenAI, Anthropic).
    
    In a full production environment, this would be powered by Microsoft Presidio 
    (which uses spaCy NLP) or a local Llama-3-8B model. For this implementation,
    we use highly optimized Regex patterns to catch and mask sensitive Indian & Global data.
    """
    
    def __init__(self):
        # Dictionary of PII patterns
        self.patterns = {
            "EMAIL": r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
            "PHONE": r'(\+91[\-\s]?)?[6-9]\d{9}',
            "UPI_ID": r'[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}',
            "CREDIT_CARD": r'(?:\d[ -]*?){13,16}',
            "AADHAAR": r'\b\d{4}\s\d{4}\s\d{4}\b',
            "PAN_CARD": r'[A-Z]{5}[0-9]{4}[A-Z]{1}'
        }

    def redact(self, text: str) -> str:
        """
        Scans the text for PII and replaces it with a masked token.
        Example: 'My UPI is sanjay@oksbi' -> 'My UPI is [UPI_ID_REDACTED]'
        """
        redacted_text = text
        for entity_type, pattern in self.patterns.items():
            # Replace matches with [ENTITY_TYPE_REDACTED]
            redacted_text = re.sub(pattern, f"[{entity_type}_REDACTED]", redacted_text)
            
        return redacted_text

# Example usage:
# redactor = PIIRedactor()
# print(redactor.redact("My phone is +91-9876543210 and UPI is krish@icici"))
