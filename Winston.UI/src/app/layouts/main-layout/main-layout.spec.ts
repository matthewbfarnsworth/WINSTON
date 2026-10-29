import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api';
import { ApiServiceStub } from '../../../testing/api-service.stub';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        { provide: ApiService, useClass: ApiServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    await fixture.whenStable();
  });

  it('renders the current user avatar', () => {
    const avatar = fixture.nativeElement.querySelector('app-avatar') as HTMLElement;

    expect(avatar.textContent).toContain('A');
  });

  it('renders navigation for every primary page', () => {
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('nav a') as NodeListOf<HTMLAnchorElement>
    ).map(link => link.textContent?.trim());

    expect(links).toEqual(['Home', 'Trips', 'Transactions', 'Settings']);
  });
});
