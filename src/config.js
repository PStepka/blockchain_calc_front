export const config = {
    BACKEND_URL: 'http://localhost:3000/',
    MAX_HISTORY_LENGTH: 3,
    BINARY_OPERATORS: {
        "+": 0,
        "-": 1,
        "/": 2,
        "*": 3,
        "err": 4
    },
    UNARY_OPERATORS: {
        "invert": 0,
        "sqrt": 1
    }
}
