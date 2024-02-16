// Vue component
new Vue({
    el: '#app',
    data: {
        isDrawing: false,
        context: null,
        model: null,
        classification: '',
        modelLoaded: false,
        confidence: null,
    },
    mounted() {
        this.initCanvas();
        this.loadModel();
        const canvas = document.getElementById('canvas');
    
        // Use arrow functions to ensure 'this' context is preserved
        canvas.addEventListener('touchstart', (event) => this.handleTouchStart(event), {passive: false});
        canvas.addEventListener('touchmove', (event) => this.handleTouchMove(event), {passive: false});
        canvas.addEventListener('touchend', () => this.stopDrawing());
    },
    methods: {
        async loadModel() {
            this.model = await tf.loadGraphModel('./models/mnist_cnn_tfjs/model.json');
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
        },
        startDrawing(event) {
            this.isDrawing = true;
            this.context.beginPath();
            this.context.moveTo(event.offsetX, event.offsetY);
        },
        draw(event) {
            if (!this.isDrawing) return;

            // Smooth drawing by adding intermediate points
            const currentX = event.offsetX;
            const currentY = event.offsetY;
            const lastX = this.lastX || currentX;
            const lastY = this.lastY || currentY;

            // Interpolate points for a smoother line
            const distance = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));
            const angle = Math.atan2(currentY - lastY, currentX - lastX);
            const steps = distance / 2; // Adjust step size for smoothness
            for (let i = 0; i < steps; i++) {
                const x = lastX + Math.cos(angle) * i * 2; // Step size
                const y = lastY + Math.sin(angle) * i * 2; // Step size
                this.context.lineTo(x, y);
                this.context.stroke();
            }

            this.context.beginPath();
            this.context.moveTo(currentX, currentY);

            this.lastX = currentX;
            this.lastY = currentY;
        },
        // Reset lastX and lastY on stopDrawing
        stopDrawing() {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.lastX = null;
                this.lastY = null;
            }
        },
        handleTouchStart(event) {
            event.preventDefault(); // Prevent scrolling when touching the canvas
            let touch = event.touches[0];
            let mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            document.getElementById('canvas').dispatchEvent(mouseEvent);
        },
        
        handleTouchMove(event) {
            event.preventDefault(); // Prevent scrolling when moving over the canvas
            let touch = event.touches[0];
            let mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            document.getElementById('canvas').dispatchEvent(mouseEvent);
        },        
        resetCanvas() {
            // Clear the canvas
            this.context.fillStyle = "#000000"; // Set to the background color of your choice
            this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

            // Reset any other drawing state as needed
            this.isDrawing = false;
            this.lastX = null;
            this.lastY = null;
            this.classification = ''; // Optionally clear the previous classification
            this.confidence = null; // Optionally clear the previous confidence
        },
        downloadDigit() {
            // Simplified without changing functionality
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
        async classifyDigit() {
            // Simplified without altering the logic
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
                this.classification = prediction[0];
                const confidence = confidenceScores[prediction[0]];
                this.confidence = (confidence * 100).toFixed(2);
                console.log(`Predicted class: ${prediction[0]}, Confidence: ${this.confidence}%`);
            });
        },       
    },
});