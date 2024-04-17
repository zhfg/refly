from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SelectorType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    XPath: _ClassVar[SelectorType]
XPath: SelectorType

class ParseHTMLRequest(_message.Message):
    __slots__ = ("html", "selector_type", "selectors")
    HTML_FIELD_NUMBER: _ClassVar[int]
    SELECTOR_TYPE_FIELD_NUMBER: _ClassVar[int]
    SELECTORS_FIELD_NUMBER: _ClassVar[int]
    html: str
    selector_type: SelectorType
    selectors: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, html: _Optional[str] = ..., selector_type: _Optional[_Union[SelectorType, str]] = ..., selectors: _Optional[_Iterable[str]] = ...) -> None: ...

class HTMLFragment(_message.Message):
    __slots__ = ("selector_type", "selector", "content")
    SELECTOR_TYPE_FIELD_NUMBER: _ClassVar[int]
    SELECTOR_FIELD_NUMBER: _ClassVar[int]
    CONTENT_FIELD_NUMBER: _ClassVar[int]
    selector_type: SelectorType
    selector: str
    content: str
    def __init__(self, selector_type: _Optional[_Union[SelectorType, str]] = ..., selector: _Optional[str] = ..., content: _Optional[str] = ...) -> None: ...

class ParseHTMLResult(_message.Message):
    __slots__ = ("fragments",)
    FRAGMENTS_FIELD_NUMBER: _ClassVar[int]
    fragments: _containers.RepeatedCompositeFieldContainer[HTMLFragment]
    def __init__(self, fragments: _Optional[_Iterable[_Union[HTMLFragment, _Mapping]]] = ...) -> None: ...
