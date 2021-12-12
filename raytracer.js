// A simple raytracer based on https://www.gabrielgambetta.com/computer-graphics-from-scratch/02-basic-raytracing.html
let canvas, canvasWidth, canvasHeight, context, imageData, pixels; // Global variables instead of passing everything around all the time
let spheres = [
    {
        center: [0, -1, 3],
        radius: 1,
        colour: [255, 0, 0],
    },
    {
        center: [2, 0, 4],
        radius: 1,
        colour: [0, 0, 255],
    },
    {
        center: [-2, 0, 4],
        radius: 1,
        colour: [0, 255, 0],
    },
];

window.onload = function () {
    canvas = document.getElementById("image");
    canvasWidth = canvas.width / 2;
    canvasHeight = canvas.height / 2;

    // Get all pixels on canvas
    // Source: https://stackoverflow.com/questions/46017660/html5-canvas-better-pixel-control-and-better-speed
    context = canvas.getContext("2d");
    imageData = context.createImageData(canvasWidth * 2, canvasHeight * 2);
    pixels = imageData.data;

    drawCanvas();
};

function drawCanvas() {
    // Finds colour for each pixel and draws to canvas
    for (let x = -canvasWidth; x < canvasWidth; x++) {
        for (let y = -canvasHeight; y < canvasHeight; y++) {
            viewportPosition = canvasToViewport(x, y);
            colour = traceRay([0, 0, 0], viewportPosition, 1, Infinity);

            // Pixels is an array of pixels where each pixels has four values: r, g, b and a
            const imageIndex =
                (x + canvasWidth + (y + canvasHeight) * canvasHeight * 2) * 4;
            pixels[imageIndex] = colour[0]; // r
            pixels[imageIndex + 1] = colour[1]; // g
            pixels[imageIndex + 2] = colour[2]; // b
            pixels[imageIndex + 3] = 255; // a
        }
    }

    // Update canvas
    context.putImageData(imageData, 0, 0);
}

function canvasToViewport(x, y) {
    return [x / canvasWidth, y / canvasHeight, 1];
}

function traceRay(origin, viewportPosition, tMin, tMax) {
    let closestT = Infinity;
    let closestSphere = null;

    // Get colour of closest sphere
    for (sphere of spheres) {
        [t1, t2] = intersectRaySphere(origin, viewportPosition, sphere);

        if (t1 >= tMin && t1 <= tMax && t1 < closestT) {
            closestT = t1;
            closestSphere = sphere;
        }

        if (t2 >= tMin && t2 <= tMax && t2 < closestT) {
            closestT = t2;
            closestSphere = sphere;
        }
    }

    if (closestSphere === null) {
        return [255, 255, 255]; // Return white
    }

    return closestSphere.colour;
}

function intersectRaySphere(origin, viewportPosition, sphere) {
    const radius = sphere.radius;
    const sphereOriginVector = vectorMinus(origin, sphere.center);

    // ot^2 + pt + q = 0 quadratic equation
    const o = dot(viewportPosition, viewportPosition);
    const p = 2 * dot(sphereOriginVector, viewportPosition);
    const q = dot(sphereOriginVector, sphereOriginVector) - radius * radius;

    // Discrimant determines properties of a quadratic equations roots such as positive/negative
    const discriminant = p * p - 4 * o * q;
    if (discriminant < 0) {
        return [Infinity, Infinity];
    }

    // Solve quadratic equation
    const t1 = (-p + Math.sqrt(discriminant)) / (2 * o);
    const t2 = (-p - Math.sqrt(discriminant)) / (2 * o);

    return [t1, t2];
}

// Math functions
// Source: https://stackoverflow.com/questions/64816766/dot-product-of-two-arrays-in-javascript
function dot(a, b) {
    return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function vectorMinus(a, b) {
    newArray = [];
    for (let i = 0; i < a.length; i++) {
        newArray.push(a[i] - b[i]);
    }

    return newArray;
}
