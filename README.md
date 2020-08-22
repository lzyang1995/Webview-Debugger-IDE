# Webview-Debugger-IDE

An IDE-like App built with Electron for debugging HTML5 pages in mobile webview. It contains webview emulator, code editor, Chrome DevTools and terminal. More importantly, it emulates protocol-based interaction between HTML5 page and mobile webview. It is written during internship at CMB. However, currently it is still incomplete and needs improvement in many aspects. 

## Background

Currently many mobile Apps are hybrid and contains both native components and HTML5 (H5) pages. H5 pages are hosted in Webviews. In order to enable H5 pages to access native functionality, such as getting contact information or setting Webview title, one possible approach is to send requests with custom scheme and URL, i.e. custom protocol, from the H5 page, and the Webview then intercepts the request, parses it and invoke corresponding native functionality. For sending feedback to the H5 page, the Webview can use methods like loadUrl or evaluateJavascript to invoke a global function defined in H5 and pass in certain data. 

However, debugging the H5 pages is not easy. We can test them in real Webview in the App, but we need to build and deploy the H5 pages first. If there is a bug, we need to build and deploy it again, which is troublesome. Instead, we can choose to debug them locally, but common tools such as Chrome DevTools do not support custom protocols, thus we cannot test the logic related to interaction bewteen H5 and Webview. 

To this end, I build such a simple IDE Application for debugging H5 pages to be used in Webview locally, with emphasis on supporting custom protocols and emulating the interaction. In this Application, the developer can edit the protocol, define menu items in Webview menu, and set up feedback data to be sent to H5 pages. Our Application will intercept the custom protocols and perform certain actions. If errors exist, e.g. the path/parameter is incorrect, or the designated callback does not exist, it will show related error messages. Otherwise, it will give a successful prompt. In this way, we can help developers debug the interaction related logics.

## Usage

The application has been tested on Windows system only. Firstly, clone this repository and also an example project repository:

```
git clone https://github.com/lzyang1995/Webview-Debugger-IDE.git
git clone https://github.com/lzyang1995/Webview-Debugger-IDE-Example-Project.git
cd Webview-Debugger-IDE
```

### Production


