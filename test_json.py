import time, os, json
from dotenv import load_dotenv
load_dotenv('.env')
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

system_prompt = '''You are Krish, a dynamic customer support AI.
Current Checklist: {}
Missing Fields: ['order_id', 'issue', 'demand']
Pre-computed Policy Plan: 

INSTRUCTIONS:
1. Extract any new checklist items from the user's message.
2. If there are still Missing Fields, formulate a friendly 1-2 sentence reply asking for ONE of them. Do not ask for multiple things.
3. If there are NO Missing Fields, you must resolve the ticket! Use the 'Pre-computed Policy Plan' to tell the user their final resolution.

CRITICAL: You must return ONLY raw JSON matching this schema exactly, with NO markdown formatting, NO backticks, and NO other text:
{
  "reply": "string, the friendly 1-2 sentence response",
  "extracted_checklist": {
    "field_name": "string, the extracted value"
  }
}
'''

prompt = ChatPromptTemplate.from_messages([
    ('system', system_prompt),
    ('user', 'i ordered from swiggy now i want replacement the food does not taste good')
])

print('Testing liquid/lfm-2.5-2.6b:free raw JSON...')
llm = ChatOpenAI(base_url='https://openrouter.ai/api/v1', api_key=os.environ.get('OPENROUTER_API_KEY'), model='liquid/lfm-2.5-2.6b:free', model_kwargs={'extra_headers': {'HTTP-Referer': 'http://localhost'}})
chain = prompt | llm
s = time.time()
try:
    res = chain.invoke({})
    print(f'SUCCESS! took {time.time()-s:.2f}s')
    print('Raw Output:', res.content)
    clean = res.content.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    if clean.endswith("```"):
        clean = clean[:-3]
    parsed = json.loads(clean.strip())
    print('Parsed:', parsed)
except Exception as e:
    print(f'FAILED: {e}')
