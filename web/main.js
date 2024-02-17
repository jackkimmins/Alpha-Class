new Vue({
    el: '#app',
    data: {
        isDrawing: false,
        context: null,
        model: null,
        classification: '...',
        modelLoaded: false,
        confidence: '...',
        selectedModel: 'mnist',
    },
    mounted() {
        this.initCanvas();
        this.loadModel();
        window.addEventListener('keyup', this.handleKeyUp);
    },
    methods: {
        async loadModel() {
            this.modelLoaded = false;
            let modelPath = './models/';
            modelPath += this.selectedModel === 'emnist' ? 'emnist_cnn_tfjs/model.json' : 'mnist_cnn_tfjs/model.json';
            this.model = await tf.loadGraphModel(modelPath);
            this.modelLoaded = true;
        },
        initCanvas() {
            const canvas = document.getElementById('canvas');
            this.context = canvas.getContext('2d');
            this.context.fillStyle = "#000000";
            this.context.fillRect(0, 0, canvas.width, canvas.height);
            this.context.strokeStyle = "#FFFFFF";
            this.context.lineWidth = 16;
            this.context.lineCap = "round";

            // Listeners for drawing
            canvas.addEventListener('mousedown', this.startDrawing);
            canvas.addEventListener('mousemove', this.draw);
            canvas.addEventListener('mouseup', this.stopDrawing);

            // Touch listeners for mobile support
            canvas.addEventListener('touchstart', this.handleTouchStart, false);
            canvas.addEventListener('touchmove', this.handleTouchMove, false);
            canvas.addEventListener('touchend', this.stopDrawing, false);
        },
        startDrawing(event) {
            this.isDrawing = true;
            this.context.beginPath();
            this.context.moveTo(event.offsetX, event.offsetY);
        },
        draw(event) {
            if (!this.isDrawing) return;

            // Smooth drawing with intermediate points
            const currentX = event.offsetX;
            const currentY = event.offsetY;
            const lastX = this.lastX || currentX;
            const lastY = this.lastY || currentY;

            // Interpolate points for a smoother line
            const distance = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));
            const angle = Math.atan2(currentY - lastY, currentX - lastX);
            const steps = distance / 2;
            for (let i = 0; i < steps; i++) {
                const x = lastX + Math.cos(angle) * i * 2;
                const y = lastY + Math.sin(angle) * i * 2;
                this.context.lineTo(x, y);
                this.context.stroke();
            }

            this.context.beginPath();
            this.context.moveTo(currentX, currentY);

            this.lastX = currentX;
            this.lastY = currentY;
        },
        stopDrawing() {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.lastX = null;
                this.lastY = null;
            }
        },
        handleTouchStart(event) {
            event.preventDefault();
            let touch = event.touches[0];
            let mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            document.getElementById('canvas').dispatchEvent(mouseEvent);
        },
        
        handleTouchMove(event) {
            event.preventDefault();
            let touch = event.touches[0];
            let mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            document.getElementById('canvas').dispatchEvent(mouseEvent);
        },        
        resetCanvas() {
            this.context.fillStyle = "#000000";
            this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

            this.isDrawing = false;
            this.lastX = null;
            this.lastY = null;
            this.classification = '...';
            this.confidence = '...';
        },
        downloadDigit() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 28;
            tempCanvas.height = 28;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(this.canvas, 0, 0, 280, 280, 0, 0, 28, 28);
            const imageUrl = tempCanvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = imageUrl;
            downloadLink.download = 'digit.png';
            downloadLink.click();
        },
        convertClassToChar(classIndex) {
            const digits = '0123456789';
            const lowerCaseLetters = 'abcdefghijklmnopqrstuvwxyz';
            const upperCaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
            if (classIndex < 10) {
                return digits[classIndex];
            } else if (classIndex < 36) {
                return upperCaseLetters[classIndex - 10];
            } else {
                return lowerCaseLetters[classIndex - 36];
            }
        },
        handleKeyUp(event) {
            if (event.key === 'Enter') this.classifyDigit();
        },
        async classifyDigit() {
            const tensor = tf.browser.fromPixels(this.context.getImageData(0, 0, 280, 280), 1)
                .resizeBilinear([28, 28])
                .toFloat()
                .div(tf.scalar(255.0))
                .expandDims(0);
            const prediction = this.model.predict(tensor);
            const scores = prediction.softmax();
            const predictedClass = prediction.argMax(1);
            const confidenceScores = await scores.data();
        
            predictedClass.data().then((prediction) => {
                const classIndex = prediction[0];

                // Convert class index to character
                const char = this.convertClassToChar(classIndex);
                this.classification = char;
        
                const confidence = confidenceScores[classIndex];
                this.confidence = (confidence * 100).toFixed(2);
                console.log(`Predicted class: ${char}, Confidence: ${this.confidence}%`);
            });
        },    
        beforeDestroy() {
            window.removeEventListener('keyup', this.handleKeyUp);
        }
    },
});