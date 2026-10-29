import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LinkButton } from './link-button';

describe('LinkButton', () => {
  let component: LinkButton;
  let fixture: ComponentFixture<LinkButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkButton],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders its router link', () => {
    fixture.componentRef.setInput('routerLink', '/trips');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/trips');
  });

  it('uses muted styling when requested', () => {
    fixture.componentRef.setInput('variant', 'muted');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.className).toContain('text-slate-500');
  });
});
