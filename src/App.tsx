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
      content: `Eres un asistente experto en la historia de la Argentina. Responde de forma breve y clara.
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">
          Chat IA
        </h1>

        <button
          onClick={toggleRecording}
          className={`w-full py-4 rounded-full text-white font-bold text-lg transition-all ${
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

        <p className="text-center text-gray-500 text-sm mt-4">
          © {new Date().getFullYear()} Ignacio M.
        </p>
      </div>
    </div>
  );
}

export default App;
