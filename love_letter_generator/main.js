const GOOGLE_API_KEY = "Replace with your Gemini Api Key";
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`;

        function startGenerating() {
            const yourName = document.getElementById('yourName').value;
            const partnerName = document.getElementById('partnerName').value;
            const memory = document.getElementById('memory').value;
            if (!yourName || !partnerName || !memory) {
                alert("Please fill in all fields before generating the letter.");
                return;
            }
            document.getElementById('loadingText').classList.remove('hidden');
            fetchAIResponse(yourName, partnerName, memory);
        }

        async function fetchAIResponse(yourName, partnerName, memory, retry = false) {
            const tone = document.getElementById('tone').value;

            // Sanitize memory input (removes possible trigger words)
            const safeMemory = memory.replace(/[^a-zA-Z0-9\s,.!?]/g, "");

            // Avoid Gemini misinterpretation
            let promptText = `Compose a heartfelt message from ${yourName} to ${partnerName}.
                Express deep admiration, appreciation, and a strong emotional bond.
                Keep it lighthearted, wholesome, and suitable for all audiences.
                Reference this wonderful shared experience: ${safeMemory}.`;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
            };

            try {
                const response = await fetch(API_REQUEST_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API error: ${errorData.error.message}`);
                }

                const data = await response.json();
                console.log("API Response:", JSON.stringify(data, null, 2));

                // Safety check
                const safetyFlags = data.candidates?.[0]?.safetyRatings || [];
                const flaggedCategory = safetyFlags.find(rating => rating.probability === "HIGH" || rating.probability === "MEDIUM");

                if (flaggedCategory) {
                    console.warn(`🚨 Content flagged for: ${flaggedCategory.category}`);
                    
                    if (retry) {
                        throw new Error("AI keeps flagging your input. Try rephrasing your memory.");
                    }
                    
                    // Retry ONCE with a more generic memory
                    return fetchAIResponse(yourName, partnerName, "a wonderful day together", true);
                }

                // Check for valid response
                const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!generatedText) {
                    throw new Error("Invalid response format from API");
                }

                document.getElementById('loadingText').classList.add('hidden');
                document.getElementById('letter').innerHTML = formatLetter(generatedText, yourName, partnerName);
                document.getElementById('letter').classList.remove('hidden');

            } catch (error) {
                console.error("❌ Error fetching AI response:", error);
                document.getElementById('loadingText').classList.add('hidden');
                alert(error.message);
            }
        }

        function formatLetter(content, yourName, partnerName) {
            const date = new Date().toLocaleDateString();
            // Clean up the content to remove duplicate salutations
            const cleanedContent = content.replace(/My Dearest /g, '').replace(/Dearest /g, '');
            return `
                <div class="letter-container">
                    <h2>My Dearest ${partnerName},</h2>
                    <p>${cleanedContent.replace(/\n/g, '</p><p>')}</p>
                </div>
            `;
        }

        function saveLetter() {
            const letter = document.getElementById('letter').innerHTML;
            if (!letter) {
                alert("No letter to save!");
                return;
            }
            saveToLocalStorage(letter);
            alert("Letter saved successfully!");
        }

        function saveToLocalStorage(letter) {
            let savedLetters = JSON.parse(localStorage.getItem("loveLetters")) || [];
            savedLetters.unshift(letter); // Add to the beginning of the array
            localStorage.setItem("loveLetters", JSON.stringify(savedLetters));
        }

        function viewSavedLetters() {
            const savedLetters = JSON.parse(localStorage.getItem("loveLetters")) || [];
            const lettersList = document.getElementById('lettersList');
            lettersList.innerHTML = '';

            if (savedLetters.length === 0) {
                lettersList.innerHTML = '<p class="text-gray-600">No saved letters yet.</p>';
            } else {
                savedLetters.forEach((letter, index) => {
                    const letterDiv = document.createElement('div');
                    letterDiv.className = 'mt-4 p-4 bg-pink-50 border-l-4 border-pink-500 rounded-xl relative';

                    const previewText = letter.split(' ').slice(0, 10).join(' ') + '...';
                    letterDiv.innerHTML = `
                        <p class="text-gray-700 cursor-pointer" onclick="toggleLetter(this)">${previewText}</p>
                        <div class="text-gray-700 hidden">${letter}</div>
                        <button onclick="deleteLetter(${index})" class="absolute top-2 right-2 text-red-500 hover:text-red-700">✕</button>
                        <div class="mt-2 flex space-x-2">
                            <button onclick="saveAsImage(${index})" class="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center">
                                <span class="mr-2">🖼️</span> Save as Image
                            </button>
                            <button onclick="saveAsPDF(${index})" class="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center">
                                <span class="mr-2">📄</span> Save as PDF
                            </button>
                        </div>
                    `;
                    lettersList.appendChild(letterDiv);
                });
            }

            document.getElementById('savedLetters').classList.remove('hidden');
        }

        function toggleLetter(element) {
            const fullText = element.nextElementSibling;
            fullText.classList.toggle('hidden');
        }

        function deleteLetter(index) {
            if (confirm("Are you sure you want to delete this letter?")) {
                let savedLetters = JSON.parse(localStorage.getItem("loveLetters")) || [];
                savedLetters.splice(index, 1);
                localStorage.setItem("loveLetters", JSON.stringify(savedLetters));
                viewSavedLetters();
            }
        }

        function clearAllLetters() {
            if (confirm("Are you sure you want to delete all saved letters?")) {
                localStorage.removeItem("loveLetters");
                viewSavedLetters();
            }
        }

        function generateCard() {
            const letter = document.getElementById('letter').innerText;
            if (!letter) {
                alert("Generate a letter first!");
                return;
            }
            const cardWindow = window.open("", "_blank");
            cardWindow.document.write(`<html><head><title>Valentine's Card</title></head><body style='text-align:center; font-family:Arial, sans-serif; background:#ffd1dc; padding:50px;'><h2>💖 Valentine's Card 💖</h2><p style='font-size:18px;'>${letter}</p><p>❤️ From Your Love ❤️</p></body></html>`);
        }

        function saveAsImage(index) {
            const savedLetters = JSON.parse(localStorage.getItem("loveLetters")) || [];
            const letter = savedLetters[index];
            const letterDiv = document.createElement('div');
            letterDiv.className = 'letter-container';
            letterDiv.innerHTML = letter;
            document.body.appendChild(letterDiv);

            html2canvas(letterDiv).then(canvas => {
                const link = document.createElement('a');
                link.download = 'love-letter.png';
                link.href = canvas.toDataURL();
                link.click();
                document.body.removeChild(letterDiv);
            });
        }

        function saveAsPDF(index) {
            const { jsPDF } = window.jspdf;
            const savedLetters = JSON.parse(localStorage.getItem("loveLetters")) || [];
            const letter = savedLetters[index];
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.setFont('Georgia', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`My Dearest ${document.getElementById('partnerName').value},`, 10, 20);
            doc.setFontSize(14);
            doc.text(letter.replace(/<[^>]+>/g, ''), 10, 30, { maxWidth: 180 });
            doc.setFontSize(12);
            doc.text(`With all my love,`, 10, 200);
            doc.text(`${document.getElementById('yourName').value}`, 10, 210);
            doc.text(new Date().toLocaleDateString(), 10, 220);
            doc.save('love-letter.pdf');
        }

        function createHearts() {
            setInterval(() => {
                let heart = document.createElement("div");
                heart.innerHTML = "❤️";
                heart.classList.add("heart");
                document.body.appendChild(heart);
                heart.style.left = Math.random() * 100 + "vw";
                heart.style.top = "100vh";
                heart.style.animationDuration = Math.random() * 3 + 2 + "s";
                setTimeout(() => heart.remove(), 5000);
            }, 300);
        }

        createHearts();