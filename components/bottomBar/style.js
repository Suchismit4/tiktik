import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        height: 85, // Slightly taller for better spacing
        paddingHorizontal: 35,
        paddingTop: 13, // More space on top
        paddingBottom: 18, // More padding at the bottom for separation

        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000',
        zIndex: 10,
        alignItems: 'center',
    },
    iconsHolder: {
        flexDirection: 'row',
        justifyContent: "space-evenly",
        alignItems: 'center',
        width: '100%',
        alignSelf: 'center',
    },
    icons: {
        width: 30, // Slightly smaller icons
        height: 30
    },
    iconHolder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {        
        fontFamily: "ClashDisplay",
        fontSize: 12,
        fontWeight: "100",
        marginTop: 5,
        color: "#ddd",
        textAlign: 'center',
    }
});

export default styles;
