// A simple raytracer based on https://www.gabrielgambetta.com/computer-graphics-from-scratch/02-basic-raytracing.html
let canvas, canvasWidth, canvasHeight, context, imageData, pixels; // Global variables instead of passing everything around all the time

// Higher specular = more shiny
const spheres = [
    {
        center: [-0.35, 0.65, 3],
        radius: 0.35,
        colour: [0, 0, 255],
        specular: 2000,
        reflection: 0.3,
    },
    {
        center: [0.35, 0.65, 2.5],
        radius: 0.35,
        colour: [255, 255, 0],
        specular: 1000,
        reflection: 0.5,
    },
    // Floor
    {
        center: [0, 5001, 0],
        radius: 5000,
        colour: [255, 255, 255],
        specular: 1000,
        reflection: 0,
    },
    // Ceiling
    {
        center: [0, -5001, 0],
        radius: 5000,
        colour: [255, 255, 255],
        specular: 1000,
        reflection: 0,
    },
    // Left wall
    {
        center: [-5001, 0, 0],
        radius: 5000,
        colour: [150, 0, 0],
        specular: 1000,
        reflection: 0,
    },
    // Right wall
    {
        center: [5001, 0, 0],
        radius: 5000,
        colour: [0, 150, 0],
        specular: 1000,
        reflection: 0,
    },
    // Front wall
    {
        center: [0, 0, -5001],
        radius: 5000,
        colour: [255, 255, 255],
        specular: 1000,
        reflection: 0.9,
    },
    // Back wall
    {
        center: [0, 0, 5005],
        radius: 5000,
        colour: [255, 255, 255],
        specular: 1000,
        reflection: 0.9,
    },
];

// Light types
const AMBIENT = 0;
const POINT = 1;
const DIRECTIONAL = 2;

const lights = [
    {
        type: AMBIENT,
        intensity: 0.2,
    },
    {
        type: POINT,
        intensity: 0.8,
        position: [0, -0.9, 2],
    },
];

window.onload = function () {
    canvas = document.getElementById("image");
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    // Get all pixels on canvas
    // Source: https://stackoverflow.com/questions/46017660/html5-canvas-better-pixel-control-and-better-speed
    context = canvas.getContext("2d");
    imageData = context.createImageData(canvasWidth, canvasHeight);
    pixels = imageData.data;

    drawCanvas();
};

function drawCanvas() {
    // Finds colour for each pixel and draws to canvas
    for (let x = -canvasWidth / 2; x < canvasWidth / 2; x++) {
        for (let y = -canvasHeight / 2; y < canvasHeight / 2; y++) {
            viewportPosition = canvasToViewport(x, y);
            colour = traceRay([0, 0, 0], viewportPosition, 1, Infinity, 3);

            // Pixels is an array of pixels where each pixels has four values: r, g, b and a
            const imageIndex =
                (x + canvasWidth / 2 + (y + canvasHeight / 2) * canvasWidth) *
                4;
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

function reflectRay(ray, normal) {
    return vectorSubtraction(
        vectorMultiplication(normal, 2 * vectorDotProduct(normal, ray)),
        ray
    );
}

function closestIntersection(origin, direction, tMin, tMax) {
    let closestT = Infinity;
    let closestSphere = null;

    // Get colour of closest sphere
    for (sphere of spheres) {
        [t1, t2] = intersectRaySphere(origin, direction, sphere);

        if (t1 > tMin && t1 < tMax && t1 < closestT) {
            closestT = t1;
            closestSphere = sphere;
        }

        if (t2 > tMin && t2 < tMax && t2 < closestT) {
            closestT = t2;
            closestSphere = sphere;
        }
    }

    return [closestSphere, closestT];
}

function traceRay(origin, direction, tMin, tMax, recursionDepth) {
    [closestSphere, closestT] = closestIntersection(
        origin,
        direction,
        tMin,
        tMax
    );

    if (closestSphere == null) {
        return [255, 255, 255]; // Return white
    }

    const point = vectorAddition(
        origin,
        vectorMultiplication(direction, closestT)
    );

    const normal = vectorNormalize(
        vectorSubtraction(point, closestSphere.center)
    ); // Calculate sphere normal
    const colour = colourMultiplication(
        closestSphere.colour,
        computeLighting(
            point,
            normal,
            vectorInverse(direction),
            closestSphere.specular
        )
    );

    // Prevent infinite recursion
    const reflection = closestSphere.reflection;
    if (recursionDepth === 0 || reflection <= 0) {
        return colour;
    }

    // Compute reflection colour
    const ray = reflectRay(vectorInverse(direction), normal);
    const reflectedColour = traceRay(
        point,
        ray,
        0.001,
        Infinity,
        recursionDepth - 1
    );

    return colourAddition(
        colourMultiplication(colour, 1 - reflection),
        colourMultiplication(reflectedColour, reflection)
    );
}

function intersectRaySphere(origin, direction, sphere) {
    const radius = sphere.radius;
    const sphereOriginVector = vectorSubtraction(origin, sphere.center);

    // ot^2 + pt + q = 0 quadratic equation
    const o = vectorDotProduct(direction, direction);
    const p = 2 * vectorDotProduct(sphereOriginVector, direction);
    const q =
        vectorDotProduct(sphereOriginVector, sphereOriginVector) -
        radius * radius;

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

function computeLighting(point, normal, objectToCamera, specular) {
    let intensity = 0;

    // Add the intensity of all lights together
    for (light of lights) {
        if (light.type === AMBIENT) {
            intensity += light.intensity;
        } else {
            let direction, tMax;
            if (light.type === POINT) {
                direction = vectorSubtraction(light.position, point);
                tMax = 1;
            } else if (light.type === DIRECTIONAL) {
                direction = light.direction;
                tMax = Infinity;
            }

            // Shadow check
            [shadowSphere, shadowT] = closestIntersection(
                point,
                direction,
                0.001,
                tMax
            );

            if (shadowSphere != null) {
                continue; // In shade
            }

            // Diffuse lighting
            // Apply intensity depending on angle hit
            dotProduct = vectorDotProduct(normal, direction);

            // Don't illumnate with negative values (would make it darker)
            if (dotProduct > 0) {
                intensity +=
                    (light.intensity * dotProduct) / vectorMagnitude(direction);
            }

            // Specular lighting
            if (specular != -1) {
                const reflection = reflectRay(direction, normal);
                const reflectionDotProduct = vectorDotProduct(
                    reflection,
                    objectToCamera
                );

                // Never remove light only add
                if (reflectionDotProduct > 0) {
                    const normalizedReflectionDotProduct =
                        reflectionDotProduct /
                        (vectorMagnitude(reflection) *
                            vectorMagnitude(objectToCamera));
                    const intensityMultiplier =
                        normalizedReflectionDotProduct ** specular;

                    intensity += light.intensity * intensityMultiplier;
                }
            }
        }
    }

    return intensity;
}

// Math functions
// Source: https://stackoverflow.com/questions/64816766/dot-product-of-two-arrays-in-javascript
function vectorDotProduct(a, b) {
    return a.map((v, i) => a[i] * b[i]).reduce((sum, v) => sum + v);
}

function vectorNormalize(vector) {
    return vectorDivison(vector, vectorMagnitude(vector));
}

function vectorAddition(a, b) {
    return a.map((v, i) => v + b[i]);
}

function vectorSubtraction(a, b) {
    return a.map((v, i) => v - b[i]);
}

function vectorMultiplication(vector, value) {
    return vector.map((v) => v * value);
}

function vectorInverse(vector) {
    return vector.map((v) => -v);
}

function colourMultiplication(vector, value) {
    return vectorMultiplication(vector, value).map((v) =>
        Math.max(0, Math.min(255, v))
    );
}

function colourAddition(a, b) {
    return vectorAddition(a, b).map((v) => Math.max(0, Math.min(255, v)));
}

function vectorDivison(vector, value) {
    return vector.map((v) => v / value);
}

function vectorMagnitude(vector) {
    return Math.sqrt(vector.reduce((sum, v) => sum + v ** 2, 0));
}
