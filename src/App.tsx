import { useState, useEffect } from "react";

const recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();
const synth = window.speechSynthesis;
recognition.lang = "es-AR";
recognition.continuous = true;

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: `Eres un asistente experto en la historia de la república Argentina. Responde de forma breve y clara.
      Si no sabes la respuesta, di "No sé". No hables de otros temas.`,
    },
  ]);

  useEffect(() => {
    return () => {
      synth.cancel();
    };
  }, []);

  const toggleRecording = () => {
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      synth.cancel();
      recognition.start();
    }
    setIsRecording(!isRecording);
  };

  recognition.onresult = async (event) => {
    const userText = event.results[event.results.length - 1][0].transcript;
    if (!userText.trim()) return;

    const updatedMessages = [...messages, { role: "user", content: userText }];
    setMessages(updatedMessages);

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: updatedMessages,
        stream: false,
      }),
    });

    const { message } = await response.json();
    setMessages((prev) => [...prev, message]);

    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = "es-AR";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);

    let r = setInterval(() => {
      synth.pause();
      synth.resume();
    }, 14000);
    
    r;
  };

  return (
    <main className="container m-auto grid min-h-screen grid-rows-[auto,1fr,auto] px-4">
      <header className="text-xl font-bold leading-[4rem]">Chat</header>
      <section className="py-8 grid place-content-center">
        <button
          onClick={toggleRecording}
          className={`h-96 w-96 border-8 border-neutral-500 rounded-full transition-all ${
            isRecording
              ? "bg-red-500 animate-pulse"
              : isSpeaking
                ? "bg-yellow-500"
                : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isRecording ? (
            <span className="flex items-center justify-center">
              <span className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
              Escuchando...
            </span>
          ) : isSpeaking ? (
            "Detener voz"
          ) : (
            "Presiona para hablar"
          )}
        </button>
      </section>
      <footer className="text-center leading-[4rem] opacity-70">
        © {new Date().getFullYear()} Ignacio M.
      </footer>
    </main>
  );
}

export default App;