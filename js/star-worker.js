// js/star-worker.js

let points = [];
let width = 800;
let height = 600;

self.onmessage = function(e) {
    const data = e.data;
    if (data.type === 'init') {
        points = data.points;
        width = data.width;
        height = data.height;
        return;
    }

    if (data.type === 'resize') {
        width = data.width;
        height = data.height;
        return;
    }

    if (data.type === 'update') {
        const corridorsActive = data.corridorsActive;
        const time = data.time;
        const familyCenters = data.familyCenters || {};
        const driftSpeed = 0.04;
        const lerpSpeed = 0.06;

        const results = [];
        const minSafeY = 100;
        const maxSafeY = height - 150;

        for (let i = 0; i < points.length; i++) {
            const item = points[i];

            // 1. Update background drifting
            item.bgX -= driftSpeed * (i % 2 === 0 ? 0.8 : 1.2);
            item.bgY += driftSpeed * 0.4;

            if (item.bgX < -20) item.bgX = width + 20;
            if (item.bgX > width + 20) item.bgX = -20;
            if (item.bgY < minSafeY - 20) item.bgY = maxSafeY + 20;
            if (item.bgY > maxSafeY + 20) item.bgY = minSafeY - 20;

            let targetX, targetY, targetColor;

            if (corridorsActive) {
                const fam = item.familyName;
                const info = familyCenters[fam];
                if (!fam || !info) {
                    // Stardust float
                    const isRed = (item.originalColor === '#ef4444');
                    targetX = item.bgX;
                    targetY = item.bgY;
                    targetColor = isRed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.12)';
                } else {
                    const N = item.groupLength || 1;
                    let k = item.kIndex || 0;
                    const cX = info.xNorm * width;
                    const cY = info.yNorm * height;

                    const rotationDir = (info.hue % 2 === 0) ? 1 : -1;
                    const rotationSpeed = 0.0002 + (info.hue % 4) * 0.0001;
                    const galaxyRotation = rotationDir * rotationSpeed * time;

                    const armCount = (info.hue % 2 === 0) ? 2 : 3;
                    const armIndex = k % armCount;

                    const maxRadius = 15 + Math.sqrt(N) * 6;
                    const progress = k / N;
                    const theta = progress * Math.PI * 2.5;

                    const baseRadius = 5 + Math.pow(progress, 0.7) * maxRadius;
                    const angle = theta + (armIndex * (Math.PI * 2 / armCount)) + galaxyRotation;

                    const dispersion = (0.15 + progress * 0.3) * baseRadius;
                    const dispHashX = Math.sin(k * 13) * dispersion;
                    const dispHashY = Math.cos(k * 17) * dispersion;

                    targetX = cX + Math.cos(angle) * baseRadius + dispHashX;
                    targetY = cY + Math.sin(angle) * baseRadius + dispHashY;

                    if (baseRadius < 18) {
                        targetColor = 'hsl(180, 100%, 90%)';
                    } else {
                        const colorNoise = Math.abs(Math.sin(k * 31));
                        if (colorNoise < 0.22) {
                            targetColor = 'hsl(342, 95%, 62%)';
                        } else if (colorNoise < 0.55) {
                            targetColor = 'hsl(195, 95%, 72%)';
                        } else if (colorNoise < 0.8) {
                            targetColor = 'hsl(180, 30%, 95%)';
                        } else {
                            targetColor = info.color;
                        }
                    }
                }
            } else {
                targetX = item.bgX;
                targetY = item.bgY;
                targetColor = item.originalColor;
            }

            // Lerp screenspace positions
            item.screenX += (targetX - item.screenX) * lerpSpeed;
            item.screenY += (targetY - item.screenY) * lerpSpeed;
            item.renderedColor = targetColor;

            results.push({
                id: item.id,
                screenX: item.screenX,
                screenY: item.screenY,
                renderedColor: item.renderedColor,
                bgX: item.bgX,
                bgY: item.bgY
            });
        }

        self.postMessage({ type: 'updated', results: results });
    }
};
