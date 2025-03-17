// changed all of this
import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
    container: {
        height: 70,
        paddingHorizontal: 35, // Shortened for cleaner code
        paddingBottom: 0,

        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000',
        zIndex: 10,
        alignItems: 'center', // Ensures child elements are centered
    },
    iconsHolder: {
        flexDirection: 'row',
        justifyContent: "space-around", // Evenly distributes icons
        alignItems: 'center',
        width: '100%', // Ensures full-width usage
        alignSelf: 'center', // Centers within the container
    },
    icons: {
        width: 35,
        height: 35
    },
    iconHolder: {
        flex: 1, // Allows flexibility in centering
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {        
        fontFamily: "ClashDisplay",
        fontSize: 12,
        fontWeight: "100",
        marginTop: 5,
        color: "#ddd",
        textAlign: 'center', // Ensures text is centered below icons
    }
})

export default styles;
