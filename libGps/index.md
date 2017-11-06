# libGps

Library written in Kotlin to make accessing location data less of a hassle. libGps 
takes care of asking for permissions and setting up required listeners for you, 
requiring only 3 concise function calls to get your first location data:

in kotlin:
```kotlin
val g = Gps()   // make this global
g.init(this)    // call during onCreate() or similar
g.getLocation() // returns a Location object, you can also getLongitude(), getLatitude(), getAccuracy(), etc.
```
or in java:
```java
Gps g = new Gps();   // make this global
g.init(this);        // call during onCreate() or similar
g.getLocation();     // returns a Location object, you can also getLongitude(), getLatitude(), getAccuracy(), etc.
```

[Go to the Repository](https://github.com/afrise/libGps)

\[[home](https://afrise.github.io)\]
