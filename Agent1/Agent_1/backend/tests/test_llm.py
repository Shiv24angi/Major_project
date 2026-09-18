from app.llm.model import get_llm


llm = get_llm()

response = llm.invoke(
    "Return only the word READY"
)

print(response.content)