import { CursorState } from '../types';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

type HandUpdateCallback = (data: CursorState) => void;

class HandTrackingService {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private animationId: number | null = null;
  private lastVideoTime = -1;
  private callback: HandUpdateCallback | null = null;
  
  // Smoothing variables
  private cursorX = window.innerWidth / 2;
  private cursorY = window.innerHeight / 2;
  private targetX = window.innerWidth / 2;
  private targetY = window.innerHeight / 2;
  private smoothing = 0.2; // Higher = snappier, Lower = smoother
  
  // Interaction Logic
  private wasPinching = false;
  private pinchStartTime = 0;
  private isScrolling = false;
  private lastScrollX = 0;
  private lastScrollY = 0;
  
  // Zoom/Depth Logic
  private lastHandScale = 0; // Distance between wrist and middle finger MCP
  private zoomSensitivity = 3000; // Multiplier for scale delta to wheel delta

  async connect(onUpdate: HandUpdateCallback) {
    this.callback = onUpdate;
    try {
        await this.initializeHandTracking();
        await this.startCamera();
        this.detectLoop();
        console.log("Hand tracking initialized");
    } catch (error) {
        console.error("Hand tracking failed to initialize:", error);
    }
  }

  private async initializeHandTracking() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
  }

  private async startCamera() {
    const video = document.createElement("video");
    video.style.display = "none";
    video.autoplay = true;
    video.playsInline = true;
    
    // Append to body to ensure it's in the DOM for playback, but hidden
    document.body.appendChild(video);
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: "user" 
        } 
    });
    
    video.srcObject = stream;
    await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
            video.play();
            resolve();
        }
    });
    this.video = video;
  }

  private detectLoop = () => {
    if (this.video && this.handLandmarker) {
        let startTimeMs = performance.now();
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            const result = this.handLandmarker.detectForVideo(this.video, startTimeMs);

            if (result.landmarks && result.landmarks.length > 0) {
                const landmarks = result.landmarks[0];
                
                // Landmark 8 is index finger tip (cursor)
                const indexTip = landmarks[8];
                // Landmark 4 is thumb tip (for pinch)
                const thumbTip = landmarks[4];
                
                // Mirror X coordinates (Webcam is mirrored)
                const rawX = (1 - indexTip.x) * window.innerWidth;
                const rawY = indexTip.y * window.innerHeight;

                // Update targets
                this.targetX = rawX;
                this.targetY = rawY;

                // Apply linear interpolation (Lerp) for smoothing
                this.cursorX += (this.targetX - this.cursorX) * this.smoothing;
                this.cursorY += (this.targetY - this.cursorY) * this.smoothing;
                
                // Calculate distance for pinch detection
                const dx = indexTip.x - thumbTip.x;
                const dy = indexTip.y - thumbTip.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Heuristic threshold for "pinching"
                const isPinching = distance < 0.06; 
                
                // Calculate Hand Scale for Zoom (Distance between Wrist #0 and Middle MCP #9)
                // This is a stable proxy for "distance to camera"
                const wrist = landmarks[0];
                const middleMCP = landmarks[9];
                const currentScale = Math.sqrt(
                    Math.pow(middleMCP.x - wrist.x, 2) + 
                    Math.pow(middleMCP.y - wrist.y, 2)
                );

                const now = Date.now();
                let gesture: 'OPEN' | 'PINCH' | 'SCROLL' = isPinching ? 'PINCH' : 'OPEN';

                // --- Pointer Move Dispatch (Every Frame) ---
                // Crucial for Dragging (OrbitControls, Sliders) and Hover states
                // We dispatch pointermove with 'buttons' set if pinching to simulate dragging
                this.dispatchPointerEvent('pointermove', this.cursorX, this.cursorY, isPinching ? 1 : 0);

                // --- Pinch Interaction Logic ---
                
                // 1. Pinch Start
                if (isPinching && !this.wasPinching) {
                    this.pinchStartTime = now;
                    this.isScrolling = false;
                    this.lastScrollX = this.cursorX;
                    this.lastScrollY = this.cursorY;
                    this.lastHandScale = currentScale;
                    
                    // Dispatch pointerdown (simulates MouseDown)
                    this.dispatchPointerEvent('pointerdown', this.cursorX, this.cursorY, 1);
                }

                // 2. Pinch Hold
                if (isPinching && this.wasPinching) {
                    const duration = now - this.pinchStartTime;

                    // If held for > 2 seconds, enter Scroll/Zoom Mode
                    if (duration > 2000) {
                        this.isScrolling = true;
                        gesture = 'SCROLL';

                        // --- XY Scroll Logic (Pan) ---
                        const deltaX = this.cursorX - this.lastScrollX;
                        const deltaY = this.cursorY - this.lastScrollY;

                        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                            const element = document.elementFromPoint(this.cursorX, this.cursorY);
                            const scrollable = this.getScrollParent(element);
                            if (scrollable) {
                                scrollable.scrollBy(deltaX * -1.5, deltaY * -1.5);
                            }
                        }

                        // --- Z Zoom Logic (Depth) ---
                        // Compare current scale to previous frame's scale to detect "velocity" of Z movement
                        const scaleDelta = currentScale - this.lastHandScale;
                        
                        // Threshold to prevent jitter (deadzone)
                        if (Math.abs(scaleDelta) > 0.002) {
                            // Larger scale = Closer hand = Zoom In (Negative DeltaY for standard wheel)
                            // Smaller scale = Further hand = Zoom Out (Positive DeltaY)
                            // We invert the delta because Wheel Up (Negative) usually means Zoom In
                            const wheelDelta = -scaleDelta * this.zoomSensitivity;
                            
                            this.dispatchWheelEvent(this.cursorX, this.cursorY, wheelDelta);
                        }
                    }
                    
                    this.lastScrollX = this.cursorX;
                    this.lastScrollY = this.cursorY;
                    this.lastHandScale = currentScale;
                }

                // 3. Pinch Release
                if (!isPinching && this.wasPinching) {
                    const duration = now - this.pinchStartTime;
                    
                    // Release
                    this.dispatchPointerEvent('pointerup', this.cursorX, this.cursorY, 0);

                    // Click Logic: If valid click duration AND not scrolling
                    if (!this.isScrolling && duration > 200 && duration < 1800) {
                        this.dispatchClickEvent(this.cursorX, this.cursorY);
                    }
                    
                    this.isScrolling = false;
                }
                
                this.wasPinching = isPinching;

                // Send update
                if (this.callback) {
                    this.callback({
                        x: this.cursorX,
                        y: this.cursorY,
                        isDown: isPinching,
                        gesture: gesture
                    });
                }
            }
        }
    }
    this.animationId = requestAnimationFrame(this.detectLoop);
  }

  // Use PointerEvents for better modern web compatibility (R3F, Sliders, etc)
  private dispatchPointerEvent(type: string, x: number, y: number, buttons: number) {
      const element = document.elementFromPoint(x, y) as HTMLElement;
      if (element) {
          const event = new PointerEvent(type, {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
              pointerId: 1,
              width: 1,
              height: 1,
              pressure: buttons ? 0.5 : 0,
              isPrimary: true,
              pointerType: 'mouse', // Simulating mouse is usually most compatible
              button: buttons ? 0 : -1,
              buttons: buttons
          });
          element.dispatchEvent(event);
      }
  }

  // Helper for Wheel Event (Zoom)
  private dispatchWheelEvent(x: number, y: number, deltaY: number) {
      const element = document.elementFromPoint(x, y) as HTMLElement;
      if (element) {
          const event = new WheelEvent('wheel', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
              deltaY: deltaY,
              deltaMode: 0 // Pixel mode
          });
          element.dispatchEvent(event);
      }
  }

  // Separate Click event (PointerEvent sequence doesn't always trigger 'click' on all elements)
  private dispatchClickEvent(x: number, y: number) {
      const element = document.elementFromPoint(x, y) as HTMLElement;
      if (element) {
          const event = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y
          });
          element.dispatchEvent(event);
      }
  }

  private getScrollParent(node: Element | null): Element | null {
    if (node == null) return null;
    
    if (node instanceof HTMLElement) {
        const overflowY = window.getComputedStyle(node).overflowY;
        const overflowX = window.getComputedStyle(node).overflowX;
        const isScrollable = (overflowY !== 'visible' && overflowY !== 'hidden') || 
                             (overflowX !== 'visible' && overflowX !== 'hidden');

        if (isScrollable && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) {
            return node;
        }
    }
    return this.getScrollParent(node.parentElement);
  }

  disconnect() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.video) {
        const stream = this.video.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
        this.video.remove();
        this.video = null;
    }
    this.handLandmarker?.close();
    this.handLandmarker = null;
  }
}

export const handTracking = new HandTrackingService();