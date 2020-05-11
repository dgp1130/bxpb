/** Encodes the given binary data as text. */
export function encode(message: Uint8Array): string {
    return btoa(new TextDecoder().decode(message)); // Base64 encode the input.
}

/** Decodes the given text into binary data. */
export function decode(message: string): Uint8Array {
    return new TextEncoder().encode(atob(message)); // Base64 decode the input.
}