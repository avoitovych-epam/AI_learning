Internal AI Onboarding Notes
RAG (Retrieval-Augmented Generation)
RAG improves factual accuracy by retrieving relevant chunks from a knowledge base and injecting them into the model prompt.
The model should be instructed to use ONLY the provided context and to say "I don't know" when the answer is not present.


Chunking
Chunking splits documents into smaller pieces (e.g., 600–1000 characters). Smaller chunks can improve retrieval precision.


Embeddings
Embeddings convert text into vectors. Similar text has vectors that are close. Vector similarity (often cosine similarity) is used for retrieval.


Agentic tool usage
An agent can call tools such as a retriever, calculator, or ticketing API. A simple loop is: user question → decide tool → call tool → answer.