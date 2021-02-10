## Gotchas to consider when writing logging code ##

Loggers are written in such a way that if the relevant log level is not enabled
then the log message processing will be abandoned as early as possible to 
reduce cpu load.

e.g. if debug messages are not enabled then a line like
```
    logger.Debug("A message not needed right now");
```

Will cause very little cpu load.


Sometimes params are wanted in the message so there will usually be a suitable
method where the format string and params can be supplied, and the final 
message will only be constructed if necessary, e.g.
```
    logger.Debug("A {0} message about {1} not needed right now", 
        messageType, messageSubject);
```
or maybe
```
    logger.DebugFormat("A {0} message about {1} not needed right now", 
        messageType, messageSubject);
```

### Gotcha #1 - No string.Format()

It's tempting to generate the message ourselves, particularly when the logger
is a custom class (like some TRP `LoggingUtility` implementations) which do
not have an overload taking format string and params. e.g.
```
    logger.Debug(string.Format("A {0} message about {1} not needed right now",
        messageType, messageSubject));
```

Looks ok, but this `string.Format()` will always execute, even if debug logging
is disabled, wasting cpu.

### Gotcha #2 - No string interpolation, it IS string.Format()

Ok, so no-one uses `string.Format()` anymore anyway, it's now all about
string interpolation, so we'll just use e.g.

```
    logger.Debug($"A {messageType} message about {messageSubject} not needed right now");
```

Except string interpolation is just "syntactic sugar" for a `string.Format()`
so this is exactly the same as Gotcha #1.

String interpolation should not be used in log messages. Ever.

### Gotcha #3 - Guard logging of compute-heavy params

So we get Gotchas #1 & #2 so we now write:

```
    logger.DebugFormat("A {0} message about {1} not needed right now", 
        messageType, messageSubject);
```

But now we add a nice big debug dump of an object tree to help with debugging
e.g.:
```
    logger.DebugFormat("A {0} message about {1} not needed right now, check this out: {2}", 
        messageType, messageSubject, GetMyDebugObjectDump());
```

That's good right?  Except no it isn't, because this method will still get
called every time irrespective of whether debug logging is enabled. Only
once it's been called and the debug dump gathered is the log method called
and then abandoned because debug logging is not enabled.

The solution in any case where data has to be constructed for the debug message
is:
```
    if (logger.IsDebugEnabled) logger.Debug
        logger.DebugFormat("A {0} message about {1} not needed right now, check this out: {2}", 
            messageType, messageSubject, GetMyDebugObjectDump());
```


