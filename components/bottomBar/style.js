import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
    container: {
        height: 70,
        paddingLeft: 35,
        paddingRight: 35,
        paddingBottom: 0,
	zIndex: 12,
	position: "relative",
    },
    iconsHolder: {
        padding: 0,
        margin: 0,
        marginTop: 11,
        
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'center',
    },
    icons: {
        width: 35,
        height: 35
    },
    iconHolder: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
    },
    title: {        
        fontFamily: "ClashDisplay",
        fontSize: 12,
        fontWeight: 100,
        marginTop: 5,
        color: "#ddd"
    },
    dropdown: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
	height: 500,
	backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderColor: '#ccc',
        zIndex: 8, // Ensures it appears on top of other content
    },
    dropdownText: {
        fontSize: 18,
        color: '#333',  // Adjust text color to fit your theme
        marginVertical: 5,
        fontFamily: "ClashDisplay",  // Ensures consistency with the rest of your app
    },
    userPhoto: {
        width: 80,  // Set width of user photo
        height: 80,  // Set height of user photo
        borderRadius: 50,  // Make the image circular
        marginBottom: 40,  // Add some space between the photo and account info
    },
    galleryContainer: {
        flexDirection: 'row',     // Arrange images in a row
        flexWrap: 'wrap',         // Wrap to next line if there are many images
        justifyContent: 'center', // Center the gallery
        marginTop: 10,
    },
        galleryImage: {
        width: 80,               // Thumbnail width
        height: 80,              // Thumbnail height
        margin: 5,               // Space between thumbnails
        borderRadius: 10,        // Optional: make the corners rounded
    },

})

export default styles;
