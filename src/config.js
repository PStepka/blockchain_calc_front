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
    },
    contractAddress: '0x09F5e6b9fF037Bbee46C6017e5e9fc4E0ce04508'
}
