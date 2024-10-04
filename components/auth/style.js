import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    inputContainer: {
        width: '80%'
    },
    logoContainer: { 
        marginBottom: 10
    },
    logo: {
        fontFamily: 'ClashDisplay',
        fontSize: 25,
        color: "#000"
    },
    input: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 13,
        borderRadius: 10,
        marginTop: 10,
        width: '',
        color: "#000",
    },
    buttonContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40
    },
    button: {
        backgroundColor: "#130f40",
        width: '100%',
        paddingHorizontal: 22.5,
        paddingVertical: 15,
        borderRadius: 5,
        alignItems: 'center'
    },
    buttonOutline: {
        backgroundColor: "#ecf0f1",
        marginTop: 10,
        borderRadius: 5,
        borderColor: "#130f40",
        borderWidth: 1,

    },
    buttonText: {
        color: "#fff",
        fontWeight: '700',
        fontSize: 15,
    },
    buttonOutlineText: {
        color: "#130f40",
        fontWeight: '600',
        fontSize: 15,
    }
});

export default styles;